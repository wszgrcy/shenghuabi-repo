import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule],
})
export default class MainComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    console.log('init');
  }
}
