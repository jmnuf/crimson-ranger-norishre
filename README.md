# Crimson Ranger Norishre
Norishre is our dear dark elf ranger with beautiful crimson eyes which keeps track of the pathname within your peasy-ui web-app. She prefers to hold as little communication with you as possible while not impeeding the productivity of both of you.
> ![image](./norishre.png)
> Credit to keii from my discord for the drawing

# Peasy-UI TypeScript Router
This is a typescript based router that handles switching your pages within a [peasy-ui](https://github.com/peasy-ui/peasy-ui) app using as reference the `window.location.pathname`, essentially the current path in your domain `my-app.com` triggers path `/`, and `my-app.com/bio` triggers `/bio`, etc.

## Current Abilities
- Routing based on URL
  - Use callback `on_pulled` to check what are the path params (query params soon tm)
  - Can load models while changing the URL using a simple set of path and query params
- Customizable 404 page
- Async loading of page models
- Able to manually call onto pages with simple path params (To be expanded upon)
- Norishre updates on pop state

## Perchance Might Do
Disclaimer* This list doesn't really reflect whether it will be done or not nor the order of which they'll be done!
- Make `CrimsonRanger` route without using a URL path and move that to `Norishre`
- Make Custom 404 page and possibly other custom error pages not require path to be passed
- Parse and pass path/query parameters to subscribed components on page mount
  - Add restrictions to path/query parameters, cause redirect or display different page based on restriction
    - After parse if the parameters aren't valid according to the given restriction/parser tell subscriber 
- Better self-referring links
  - Ability to set more anchor element properties

## Install
npm
```
npm install @jmnuf/norishre@latest
```
pnpm
```
pnpm add @jmnuf/norishre@latest
```

## Usage

Using Norishre is pretty straightforward and meant to be simple. Here's an example of using it as the base for the app

```ts
// main.ts
import { UI } from "@peasy-lib/peasy-ui";
import { Norishre, missNorishre } from "@jmnuf/norishre";

// Instance a Norishre passing onto her a data "quiver"
// This quiver has the "arrow" data sets used to setup your pages
const mistress = new Norishre({
	// The key to this "arrow" is the id which is important for manual switch-ups
	home: {
		// Tell Norishre, we have the component to run here no worries about loading it
		loaded: true,
		// Tell what url path to match this arrow onto 
		path: "/",
		// The peasy-ui component to render
		model: {
			header: "Home Page",
			template: `
			<home-page>
				<h1>\${header}</h1>
			</home-page>`
		},
	},
	// Custom 404 not found page available to be set too!
	// There is a default 404 page though very minimalistic
	"%404%": {
		// 404 Page must always be loaded!
		loaded: true,
		// Here path is rather irrelevant
		// though conventionally just set it to "/**/*" for possible changes
		path: "/**/*",
		model: {
			template: `
			<div>
				<h1>Error 404</h1>
				<h3>EwE couldn't find requested page</h3>
				<p>Look for a real page scrub!</p>
			</div>
			`,
		}
	}
});

// Alternatively one can use provided function, missNorishre<T>(data: T)
// Under the hood it just builds the object as expected in above code
const mistress = missNorishre({
	home: {
		path: "/",
		model: {
			header: "Home Page",
			template: `
			<home-page>
				<h1>\${header}</h1>
			</home-page>`
		},
	},
	"%404%": {
		path: "/**/*",
		model: {
			template: `
			<div>
				<h1>Error 404</h1>
				<h3>EwE couldn't find requested page</h3>
				<p>Look for a real page scrub!</p>
			</div>
			`,
		},
	}
});

UI.create(document.body, Norishre.template, ranger);

```
Generated html when on the home page path "/"
```html
<script type="module" src="./main.js"></script>
<body>
	<!-- 
		Based on the previously shown code the following is generated by peasy when at the home page path
		-->
	<crimson-ranger class="crimson-view">
		<home-page>
			<h1>Home Page</h1>
		</home-page>
	</crimson-ranger>
</body>
```
Generated html when on an unknown page path like "/afgasda"
```html
<script type="module" src="./main.js"></script>
<body>
	<!-- 
		Based on the previously shown code the following is generated by peasy when at an unkown path
		-->
	<crimson-ranger class="crimson-view">
		<div>
			<h1>Error 404</h1>
			<h3>EwE couldn't find requested page</h3>
			<p>Look for a real page scrub!</p>
		</div>
	</crimson-ranger>
</body>
```

Though currently unverified if they are working as intended there's also the ability to create link components instances for "page" navigation

```ts
class App {
	router;
	navbar_items;

	constructor() {
		// Let's imagine that we initialize our ranger with some pages with arrows: "home", "about" and "contact"
		this.router = createRouter();
		this.navbar_items = [
			this.router.get_arrow("home", "Home"),
			this.router.get_arrow("about", "About Me"),
			this.router.get_arrow("contact", "Contact Me")
		]
	}

	static template = `
<nav>
	<ul>
		<li pui="link <=* navbar_items" class="nav-link">
			\${ link === }
		</li>
	</ul>
</nav>
<pui-app pui="\${ router === }"></pui-app>
	`;
}

UI.create(document.body, App.template, new App());
```
Should generate approximately the following html
```html
<nav>
	<ul>
		<li class="nav-link">
			<a href="/">Home</a>
		</li>
		<li class="nav-link">
			<a href="/about">About Me</a>
		</li>
		<li class="nav-link">
			<a href="/contact">Contact Me</a>
		</li>
	</ul>
</nav>
<crimson-ranger class="crimson-view">
	<!-- Here goes the active page -->
</crimson-ranger>
```
