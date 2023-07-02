import { describe, test, expect } from "@jest/globals";
import { missElf } from "../src/index";


describe("Router Creation", () => {
	const router = missElf({
		path: "",
		routes: {
			index: {
				path: "/",
				model: {
					element: null as unknown as HTMLElement,
					template: `<div \${ ==> element } id="main">Hello Home</div>`
				},
			},
			pageA: {
				path: "/page-a",
				model: {
					element: null as unknown as HTMLElement,
					template: `<div \${ ==> element } id="main"><h1>Page A</h1></div>`
				},
				on_pulled() {
					console.log("Pulled page a:", ...arguments);
				},
			},
			pageB: {
				path: "/page-b",
				model: {
					element: null as unknown as HTMLElement,
					template: `<div \${ ==> element } id="main"><h1>Page B</h1></div>`
				},
				on_pulled() {
					console.log("Pulled page b:", ...arguments);
				},
			},
			hello: {
				path: "/hello/[name]",
				model: {
					element: null as unknown as HTMLElement,
					name: "Anon",
					template: `<div \${ ==> element } id="main">Hello { name }</div>`
				}
			},
		},
		first_arrow: "index",
	});

	test("Generate correct path when pulling from quiver manually", () => {
		const hello_model = router.models.hello;
		const path = router.arrow_path("hello", {
			name: "John",
		});

		expect(typeof path).toEqual("string");

		expect(path).toEqual("/hello/John");

		router.pull_from_quiver("hello", { name: "John" });

		expect(window.location.pathname).toEqual(path);

		expect(router.active_id).toEqual("hello");

		expect(router.pulled_arrow).toEqual(hello_model);
	});
});
