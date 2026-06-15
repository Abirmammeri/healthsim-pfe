# healthsim-simulation/face_service.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import base64, cv2, os, json, tempfile

app = Flask(__name__)
CORS(app)

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    print("✅ DeepFace charge")
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("DeepFace non installe")

# Seuil strict 0.35 — bon équilibre précision/performance
SIMILARITY_THRESHOLD = 0.35

def base64_to_img(b64):
    if ',' in b64: b64 = b64.split(',')[1]
    arr = np.frombuffer(base64.b64decode(b64), np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

def get_embedding(b64):
    if not DEEPFACE_AVAILABLE:
        return np.random.rand(512).tolist()

    img = base64_to_img(b64)
    if img is None:
        raise ValueError("Image invalide")

    # Redimensionner si trop petite
    h, w = img.shape[:2]
    if w < 224 or h < 224:
        scale = max(224/w, 224/h)
        img = cv2.resize(img, (int(w*scale), int(h*scale)))

    tmp = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
    tmp_path = tmp.name
    tmp.close()
    cv2.imwrite(tmp_path, img)

    try:
        res = DeepFace.represent(
            tmp_path,
            model_name='Facenet512',
            enforce_detection=True,
            detector_backend='opencv'
        )
    finally:
        os.remove(tmp_path)

    if not res:
        raise ValueError("Aucun visage detecte")

    return res[0]['embedding']

def cos_dist(a, b):
    a = np.array(a, dtype=np.float64)
    b = np.array(b, dtype=np.float64)
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 1.0
    return float(1 - np.dot(a, b) / (na * nb))

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'deepface': DEEPFACE_AVAILABLE, 'threshold': SIMILARITY_THRESHOLD})

@app.route('/extract-embedding', methods=['POST'])
def extract():
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'error': 'Image requise', 'success': False}), 400
    try:
        emb = get_embedding(data['image'])
        return jsonify({'success': True, 'embedding': emb, 'dimensions': len(emb)})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 422

@app.route('/verify-face', methods=['POST'])
def verify():
    data = request.get_json()
    if not data or 'image' not in data or 'embedding' not in data:
        return jsonify({'error': 'Donnees manquantes', 'verified': False}), 400
    try:
        curr = get_embedding(data['image'])
        stored = data['embedding']
        if isinstance(stored, str):
            stored = json.loads(stored)

        dist = cos_dist(curr, stored)
        sim  = max(0.0, 1.0 - dist)
        verified = dist < SIMILARITY_THRESHOLD

        return jsonify({
            'verified':   verified,
            'distance':   round(dist, 4),
            'similarity': round(sim * 100, 1),
            'threshold':  SIMILARITY_THRESHOLD,
            'confidence': 'high' if dist < 0.2 else 'medium' if dist < 0.28 else 'low'
        })
    except Exception as e:
        return jsonify({'error': str(e), 'verified': False}), 422

@app.route('/detect-face', methods=['POST'])
def detect():
    data = request.get_json()
    try:
        img = base64_to_img(data['image'])
        tmp = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        tmp_path = tmp.name
        tmp.close()
        cv2.imwrite(tmp_path, img)
        try:
            faces = DeepFace.extract_faces(tmp_path, detector_backend='opencv', enforce_detection=False)
        finally:
            os.remove(tmp_path)
        return jsonify({'detected': len(faces) > 0, 'count': len(faces)})
    except Exception as e:
        return jsonify({'detected': False, 'error': str(e)})

if __name__ == '__main__':
    print(f"Service IA — port 5001 — seuil {SIMILARITY_THRESHOLD}")
    app.run(host='0.0.0.0', port=5001, debug=True)