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
			},
			slowRoute: {
				path: "/slow",
				model: async (): Promise<BaseModel> => {
					await new Promise(res => setTimeout(res, 500));
					return {
						element: null as any,
						template: `<h1>Hi I'm kinda slow to load</h1>`
					};
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

		test("With only query params", async () => {
			const router = create_router();
			let path = router.arrow_path("index", {
				query: {
					name: "John",
				}
			});

			expect(typeof path).toEqual("string");

			expect(path).toEqual("/?name=John");

			await router.pull_from_quiver("index", {
				query: {
					name: "John",
				},
			});

			expect(path).toEqual("/" + window.location.search);

			expect(router.active_id).toEqual("index");

			path = router.arrow_path("index", {
				query: {
					name: "Molly Schwartz",
				},
			});

			expect(typeof path).toEqual("string");

			expect(path).toEqual(`/?name=${encodeURIComponent("Molly Schwartz")}`);

			await router.pull_from_quiver("index", {
				query: {
					name: "Molly Schwartz",
				},
			});

			expect("/" + window.location.search).toEqual(path);

			expect(router.active_id).toEqual("index");

			path = router.arrow_path("pageA", {
				query: {
					from: "Carrot Top",
					message: "That looks good on you"
				},
			});

			expect(path).toEqual(`/page-a?from=${encodeURIComponent("Carrot Top")}&message=${encodeURIComponent("That looks good on you")}`);

			await router.pull_from_quiver("pageA", {
				query: {
					from: "Carrot Top",
					message: "That looks good on you"
				},
			});

			expect(path).toEqual("/page-a" + window.location.search);

			expect(router.active_id).toEqual("pageA");
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

		test("With path params", async () => {
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

		test("Model is loaded after pull promise is finished", async () => {
			const router = create_router();

			await router.pull_from_quiver("slowRoute");

			expect(router.models.slowRoute).toBeDefined();

			// @ts-expect-error
			delete router.models.slowRoute;

			await router.pull_from_quiver("slowRoute").then(() => {
				expect(router.models.slowRoute).toBeDefined();
			});
		});
	});

	describe("Pulling id from path", () => {
		test("Path with no params", async () => {
			const expected_id = "pageA";
			const router = create_router();
			const gottem = router.find_arrow_id_by_url("/page-a")[0];

			expect(gottem).toEqual(expected_id);
		});

		test("Path with a single path param", async () => {
			const expected_id = "hello";
			const router = create_router();
			const [got_id, got_obj] = router.find_arrow_id_by_url("/hello/world");

			expect(got_id).toEqual(expected_id);

			expect(got_obj).toBeDefined();

			expect(got_obj.path!.name).toEqual("world");
		});

		test("Path with a multiple path params", async () => {
			const expected_id = "message";
			const router = create_router();
			const [got_id, got_obj] = router.find_arrow_id_by_url("/say/hello/world");

			expect(got_id).toEqual(expected_id);

			expect(got_obj).toBeDefined();

			expect(got_obj.path!.name).toEqual("hello");
			expect(got_obj.path!.message).toEqual("world");
		});
	});
});
