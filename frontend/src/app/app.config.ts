import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  LucideAngularModule,
  Activity, Bell, ChevronRight,
  Users, AlertTriangle, Stethoscope, ArrowLeft,
  Settings, Brain, ChevronDown, ChevronUp, Heart,
  TrendingUp, TrendingDown, CheckCircle, AlertCircle, Loader2,
  Plus, Trash2, X, Bed, HeartPulse,
  Clock, ArrowUp, ArrowDown, ArrowRight,
  LayoutGrid, Zap, Settings2,
  HeartHandshake, UserCheck,
} from 'lucide-angular';
import { routes } from './app.routes';
import { AuthService } from './shared/auth.service';
import { authInterceptor } from './shared/auth-http.interceptor';

function initAuth(auth: AuthService) {
  return () => auth.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService],
      multi: true,
    },
    importProvidersFrom(
      LucideAngularModule.pick({
        Activity, Bell, ChevronRight,
        Users, AlertTriangle, Stethoscope, ArrowLeft,
        Settings, Brain, ChevronDown, ChevronUp, Heart,
        TrendingUp, TrendingDown, CheckCircle, AlertCircle, Loader2,
        Plus, Trash2, X, Bed, HeartPulse,
        Clock, ArrowUp, ArrowDown, ArrowRight,
        LayoutGrid, Zap, Settings2,
        HeartHandshake, UserCheck,
      })
    ),
  ],
};