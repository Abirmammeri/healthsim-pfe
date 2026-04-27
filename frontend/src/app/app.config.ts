import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  LucideAngularModule,
  Activity, Map as MapIcon, Bell, FlaskConical, ChevronRight, Building2,
  Users, BedDouble, AlertTriangle, Wrench, Stethoscope, UserCheck, ArrowLeft,
  Settings, Package, Brain, PlayCircle, ChevronDown, ChevronUp, Heart, Scissors,
  TrendingUp, TrendingDown, CheckCircle2, AlertCircle, FileText, Loader2, Eye,
  ArrowLeftRight, Plus, Trash2, X, Bed, HeartPulse, GraduationCap, Wrench as WrenchIcon,
} from 'lucide-angular';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(
      LucideAngularModule.pick({
        Activity, Map: MapIcon, Bell, FlaskConical, ChevronRight, Building2,
        Users, BedDouble, AlertTriangle, Wrench, Stethoscope, UserCheck, ArrowLeft,
        Settings, Package, Brain, PlayCircle, ChevronDown, ChevronUp, Heart, Scissors,
        TrendingUp, TrendingDown, CheckCircle2, AlertCircle, FileText, Loader2, Eye,
        ArrowLeftRight, Plus, Trash2, X, Bed, HeartPulse, GraduationCap,
      })
    ),
  ],
};
