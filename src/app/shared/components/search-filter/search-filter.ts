import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  id: string | number;
  label: string;
  value: any;
}

export interface SearchFilterConfig {
  placeholder?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  filters?: {
    label: string;
    key: string;
    options: FilterOption[];
    multiple?: boolean;
  }[];
}

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filter.html',
  styleUrl: './search-filter.css'
})
export class SearchFilter implements OnInit {
  @Input() config: SearchFilterConfig = {};
  @Input() initialSearchTerm: string = '';
  @Input() initialFilters: any = {};
  
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<any>();
  @Output() reset = new EventEmitter<void>();

  searchTerm: string = '';
  selectedFilters: any = {};

  ngOnInit() {
    this.searchTerm = this.initialSearchTerm;
    this.selectedFilters = { ...this.initialFilters };
  }

  onSearchChange() {
    this.searchChange.emit(this.searchTerm);
  }

  onFilterChange(filterKey: string, value: any) {
    this.selectedFilters[filterKey] = value;
    this.filterChange.emit({ ...this.selectedFilters });
  }

  onReset() {
    this.searchTerm = '';
    this.selectedFilters = {};
    this.searchChange.emit('');
    this.filterChange.emit({});
    this.reset.emit();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' || 
           Object.values(this.selectedFilters).some(value => 
             value !== null && value !== undefined && value !== '' && 
             (Array.isArray(value) ? value.length > 0 : true)
           );
  }

  getFilterDisplayValue(filter: any, value: any): string {
    if (!filter.options || !value) return value || '';
    const option = filter.options.find((opt: FilterOption) => opt.value === value);
    return option ? option.label : value;
  }
}
