import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inactive-status-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 animate-fade-in-up">
      <div class="flex items-start space-x-3">
        <svg class="w-6 h-6 text-amber-400 mt-0.5 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <div class="flex-1 animate-slide-in-right">
          <h3 class="text-lg font-semibold text-amber-200 mb-2 animate-fade-in-up">
            Real-World Impact of Deactivating {{ entityType | titlecase }}
          </h3>
          <div class="text-amber-100 space-y-2">
            <p class="font-medium animate-fade-in-up">When you deactivate "{{ entityName }}", the following happens:</p>
            <ul class="list-disc list-inside space-y-1 text-sm ml-4">
              <li class="animate-slide-in-up" style="animation-delay: 100ms">✅ <strong>Existing reservations remain valid</strong> - customers keep their bookings</li>
              <li class="animate-slide-in-up" style="animation-delay: 200ms">❌ <strong>No new bookings allowed</strong> - vehicles of this {{ entityType }} become unavailable</li>
              <li class="animate-slide-in-up" style="animation-delay: 300ms">❌ <strong>Hidden from customer filters</strong> - won't appear in booking dropdowns</li>
              <li class="animate-slide-in-up" style="animation-delay: 400ms">❌ <strong>Removed from vehicle creation</strong> - admins can't create new vehicles with this {{ entityType }}</li>
              <li class="animate-slide-in-up" style="animation-delay: 500ms">✅ <strong>Admin management continues</strong> - still visible in admin interfaces</li>
            </ul>
            <div class="mt-3 p-3 bg-amber-600/20 rounded-lg animate-slide-in-up" style="animation-delay: 600ms">
              <p class="text-sm font-medium text-amber-200">
                💡 <strong>Business Rule:</strong> This prevents customers from booking vehicles with inactive components 
                while preserving existing reservations and allowing admin oversight.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InactiveStatusWarning {
  @Input() entityType: string = '';
  @Input() entityName: string = '';
}
