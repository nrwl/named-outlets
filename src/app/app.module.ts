import { BrowserModule } from '@angular/platform-browser';
import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Injector,
  NgModule,
  OnDestroy,
  ViewContainerRef
} from '@angular/core';

import { AppComponent } from './app.component';
import {ActivatedRouteSnapshot, NavigationEnd, Router, RouterModule, RouterStateSnapshot} from '@angular/router';
import {filter} from 'rxjs/operators';
import {LoadedRouterConfig} from '@angular/router/src/config';

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

@Directive({
  selector: '[appNavigation]'
})
export class NavigationDirective {
  componentRef: ComponentRef<any>;

  constructor(router: Router, resolver: ComponentFactoryResolver, viewContainerRef: ViewContainerRef) {
    router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      viewContainerRef.clear();
      // find a node in the router state that specified what needs to be loaded in the navigation bar
      const node = this.findNavNode(router.routerState.snapshot.root);
      if (node) {
        // this is needed to handle lazy loading. if a module is lazy loaded, we need to grab its injector instead of the root one.
        const config = this.closestLoadedConfig(node);
        if (config) {
          const factory = config.module.componentFactoryResolver.resolveComponentFactory(node.data.nav);
          this.componentRef = viewContainerRef.createComponent(factory, 0, config.module.injector);
        } else {
          const factory = resolver.resolveComponentFactory(node.data.nav);
          this.componentRef = viewContainerRef.createComponent(factory);
        }
      }
    });
  }

  private findNavNode(node: ActivatedRouteSnapshot) {
    if (node.data && node.data.nav) {
      return node;
    }
    const navs = node.children.map(c => this.findNavNode(c)).filter(r => !!r);
    if (navs.length > 1) {
      throw new Error('More than one nav defined');
    } else if (navs.length === 1) {
      return navs[0];
    } else {
      return null;
    }
  }

  private closestLoadedConfig(snapshot: ActivatedRouteSnapshot): LoadedRouterConfig|null {
    if (!snapshot) { return null; }
    for (let s = snapshot.parent; s; s = s.parent) {
      const route = s.routeConfig as any;
      if (route && route._loadedConfig) { return route._loadedConfig; }
    }
    return null;
  }
}

@NgModule({
  declarations: [
    AppComponent,
    ParentComponent,
    Child1Component,
    Child2Component,
    Named1Component,
    Named2Component,
    NavigationDirective
  ],
  entryComponents: [
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
          {path: 'child1', component: Child1Component, data: {nav: Named1Component}},
          {path: 'child2', component: Child2Component, data: {nav: Named2Component}}
        ]
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '/parent/child1'
      }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(router: Router) {
  }
}
