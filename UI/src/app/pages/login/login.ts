import { Component } from '@angular/core';
import { IconDirective } from '@coreui/icons-angular';
import { NgStyle } from '@angular/common';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardGroupComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  RowComponent
} from '@coreui/angular';


@Component({
  selector: 'app-login',
  imports: [ContainerComponent, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, IconDirective, FormControlDirective, ButtonDirective, NgStyle],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

}
