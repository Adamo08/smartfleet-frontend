import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAuditService, AdminAuditLog } from '../../../../core/services/admin-audit.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.css'
})
export class AuditLog implements OnInit {
  logs: AdminAuditLog[] = [];
  isLoading = false;

  constructor(private auditService: AdminAuditService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.auditService.getAuditLogs(0, 20).subscribe({
      next: (res) => { this.logs = res.content; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }
}
