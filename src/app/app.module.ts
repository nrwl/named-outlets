import { BrowserModule } from '@angular/platform-browser';
import {Component, NgModule} from '@angular/core';

import { AppComponent } from './app.component';
import {Router, RouterModule} from '@angular/router';

@Component({
  template: `
    parent: <router-outlet></router-outlet>
  `
})
export class ParentComponent {}

@Component({
  template: `
    child1
  `
})
export class Child1Component {}

@Component({
  template: `
    child2
  `
})
export class Child2Component {}

@Component({
  template: `
    named1
  `
})
export class Named1Component {}

@Component({
  template: `
    named2
  `
})
export class Named2Component {}

@NgModule({
  declarations: [
    AppComponent,
    ParentComponent,
    Child1Component,
    Child2Component,
    Named1Component,
    Named2Component
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      {
        path: 'parent',
        component: ParentComponent,
        children: [
          {path: 'child1', component: Child1Component},
          {path: 'child2', component: Child2Component}
        ]
      },
      {
        path: '',
        outlet: 'named',
        component: Named2Component
      }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(router: Router) {
    setTimeout(() => {
      router.navigateByUrl('/parent/child1');
    }, 0);
  }
}
