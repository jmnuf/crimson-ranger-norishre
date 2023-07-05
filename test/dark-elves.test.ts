import { describe, test, expect, afterEach } from "@jest/globals";
import { missElf, RoutePulledEvent } from "../src/index";

type BaseModel<TData extends Record<string, any> = {}> = {
	element: HTMLElement;
	template: string;
} & { [K in keyof TData]: TData[K]; };

function create_router() {
	const router = missElf({
		path: "",
		routes: {
			index: {
				path: "/",
				model: {
					element: null as unknown as HTMLElement,
					template: `<div \${ ==> element } id="main">Hello Home</div>`
				} as BaseModel,
			},
			pageA: {
				path: "/page-a",
				model: {
					element: null as unknown as HTMLElement,
					template: `<div \${ ==> element } id="main"><h1>Page A</h1></div>`
				} as BaseModel,
				on_pulled() {
					console.log("Pulled page a:", ...arguments);
				},
			},
			pageB: {
				path: "/page-b",
				model: {
					element: null as unknown as HTMLElement,
					template: `<div \${ ==> element } id="main"><h1>Page B</h1></div>`
				} as BaseModel,
				on_pulled() {
					console.log("Pulled page b:", ...arguments);
				},
			},
			hello: {
				path: "/hello/[name]",
				model: {
					element: null as unknown as HTMLElement,
					name: "Anon",
					template: `<div \${ ==> element } id="main">Hello \${ name }</div>`
				} as BaseModel<{ name: string; }>
			},
			byebye: {
				path: "/goodbye/[name]",
				model: {
					element: null as unknown as HTMLElement,
					name: "Anon",
					template: `<div \${ ==> element } id="main">Goodbye \${ name }</div>`
				} as BaseModel<{ name: string; }>
			},
			message: {
				path: "/say/[name]/[message]",
				model: {
					element: null as unknown as HTMLElement,
					name: "Anon",
					message: "",
					template: `<div \${ ==> element } id="main">\${ name } \${ message }</div>`,
				} as BaseModel<{ name: string, message: string; }>,
				on_pulled(ev: RoutePulledEvent<BaseModel<{ name: string, message: string; }>>) {
					const params = ev.params!.path! as { name: string, message: string; };
					ev.model.name = params.name;
					ev.model.message = params.message;
				}
			}
		},
		first_arrow: "index",
	});
	return router;
}


describe("Dark Elf Crimson Ranger: Manual operations", () => {
	describe("Generate correct path when pulling from quiver", () => {
		test("With no extra params", async () => {
			const router = create_router();
			const path = router.arrow_path("pageA");

			expect(typeof path).toEqual("string");

			expect(path).toEqual(router.quiver.pageA.path);

			await router.pull_from_quiver("pageA");

			expect(window.location.pathname).toEqual(path);

			expect(router.active_id).toEqual("pageA");
		});

		test("With only path params", async () => {
			const router = create_router();
			let path = router.arrow_path("hello", {
				path: {
					name: "John",
				}
			});

			expect(typeof path).toEqual("string");

			expect(path).toEqual("/hello/John");

			await router.pull_from_quiver("hello", {
				path: {
					name: "John",
				},
			});

			expect(window.location.pathname).toEqual(path);

			expect(router.active_id).toEqual("hello");

			path = router.arrow_path("hello", {
				path: {
					name: "Molly Schwartz",
				},
			});

			expect(typeof path).toEqual("string");

			expect(path).toEqual(encodeURI("/hello/Molly Schwartz"));

			await router.pull_from_quiver("hello", {
				path: {
					name: "Molly Schwartz",
				},
			});

			expect(window.location.pathname).toEqual(path);

			expect(router.active_id).toEqual("hello");

			path = router.arrow_path("message", {
				path: {
					name: "Carrot Top",
					message: "That looks good on you"
				},
			});

			expect(path).toEqual(`/say/${encodeURIComponent("Carrot Top")}/${encodeURIComponent("That looks good on you")}`);

			await router.pull_from_quiver("message", {
				path: {
					name: "Carrot Top",
					message: "That looks good on you"
				},
			});

			expect(window.location.pathname).toEqual(path);

			expect(router.active_id).toEqual("message");
		});
	});


	describe("Load correct model when pulling from quiver", () => {
		test("With no extra params", async () => {
			const router = create_router();
			let page_model = router.models.pageA;

			await router.pull_from_quiver("pageA");

			expect(router.active_id).toEqual("pageA");
			expect(router.pulled_arrow).toEqual(page_model);

			page_model = router.models.pageB;

			await router.pull_from_quiver("pageB");

			expect(router.active_id).toEqual("pageB");
			expect(router.pulled_arrow).toEqual(page_model);
		});

		test("With only path params", async () => {
			const router = create_router();
			let page_model = router.models.hello;

			await router.pull_from_quiver("hello", {
				path: {
					name: "John",
				},
			});

			expect(router.active_id).toEqual("hello");
			expect(router.pulled_arrow).toEqual(page_model);

			page_model = router.models.byebye;

			await router.pull_from_quiver("byebye", {
				path: {
					name: "Molly Schwartz",
				},
			});

			expect(router.active_id).toEqual("byebye");
			expect(router.pulled_arrow).toEqual(page_model);

			page_model = router.models.message;

			await router.pull_from_quiver("message", {
				path: {
					name: "Carrot Top",
					message: "That looks good on you"
				},
			});
			expect(router.active_id).toEqual("message");
			expect(router.pulled_arrow).toEqual(page_model);
		});
	});
});
