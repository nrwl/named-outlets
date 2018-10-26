# Updating a Root Named Outlet Using a Nested Route


## If Your Url Looks Like This: /parent/child1(nav:child1nav)`

If you have a named segment in the URL (e.g., `/parent/child1(nav:child1nav)`, then you have a bunch of options. The easiest one would be to provision a separate route for the nav.

## If Your Url Looks Like This: /parent/child1`

If you don't have the named segment present in the URL, it is harder. It's difficult because you have to rely on the empty path fragment and those are special-cased in the router itself. So you will end up having something like this:

```
{
     path: 'parent',
     component: ParentComponent,
     children: [
       {path: 'child1', children: [
         {path: '', component: Child1Component}
         {path: '', outlet: 'named', component: Named1Component}
       ]},
       {path: 'child2', component: Child2Component}
     ]
}
```

The problem here is that both the main and the named outlets have to be siblings in the parent component, which isn't what you want. See branch `nesting_named_outlets` for more information.

You could try to override `rootContexts: ChildrenOutletContexts` to bypass that, but it'll create problems as it's not the supported use case. Using a custom path matcher doesn't work won't work either. It's because empty path routes are special.

### Potential Solution

You could create a directive that is similar to a router outlet and that will scan the router state and find a registered navigation component.

In this case, the configuration will look like this:

```
 RouterModule.forRoot([
      {
        path: 'parent',
        component: ParentComponent,
        children: [
          {path: 'child1', component: Child1Component, data: {nav: Named1Component}},
          {path: 'child2', component: Child2Component, data: {nav: Named2Component}}
        ]
      }
    ])
```   

And you will define your outlet directive like this:

```

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
```

It's a bit crafty. This is to handle lazy loading correctly. See the `nav_implemented` branch for more information.


