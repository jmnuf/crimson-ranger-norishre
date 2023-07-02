import { describe, test, expect } from "@jest/globals";
import { UI } from "@peasy-lib/peasy-ui";
import { missNorishre } from "../src/index";


describe("Router Creation", () => {
	const router = missNorishre({
		index: {
			path: "/",
			model: {
				element: null as unknown as HTMLDivElement,
				template: `<div \${ ==> element } id="main">Hello Home</div>`
			},
		},
		hello: {
			path: "/hello/[name]",
			model: {
				element: null as unknown as HTMLElement,
				name: "Anon",
				template: `<div \${ ==> element } id="main">Hello { name }</div>`
			}
		}
	});
	UI.create(document.body, router);
	const index_model = router.models.index;
	const hello_model = router.models.hello;
	test("Router is created", () => {
		const doc_elem = document.querySelector("#main");
		const mod_elem = router.models.index.element;
		expect(doc_elem).not.toBeUndefined();
		expect(mod_elem).not.toBeUndefined();
		expect(doc_elem).toEqual(mod_elem);
	});

	test("Generating correct path on quiver pull", () => {
		const path = router.arrow_path("hello", {
			name: "John",
		});

		expect(typeof path).toEqual("string");

		expect(path).toEqual("/hello/John");

		router.pull_from_quiver("hello", { name: "John" });

		expect(window.location.pathname).toEqual(path);
	});
});
