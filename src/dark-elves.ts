import {
	ArrowModels, DelayedRoute, ExtraParams, KeyOf,
	LaidRoute, PeasyUIModel, Quiver,
	RangerConfig, RangerConfigIntoQuiver, Route
} from "./base-types";

export const Base404Page = {
	template: `<div class="crimson-report-unkown-page"><h1>404 Error: Page not found</h1><h2>Something is missing...</h2></div>`,
} as const;


type AbsoluteArrowPath<T extends Quiver> = Exclude<KeyOf<T>, `%${string}` | `${string}[${string}]${string}`>;

const path_param_regex = /\[([^\]]+)\]/;

export class CrimsonRanger<const T extends Quiver> {
	static readonly template = `<crimson-ranger class="crimson-view" pui="pulled_arrow ==="></crimson-ranger>` as const;
	readonly quiver: T;
	readonly models: ArrowModels<T>;
	protected _arrow_id: KeyOf<T>;
	protected _prev_arrow_id: KeyOf<T>;
	protected _loading_models: Map<string, Promise<PeasyUIModel>>;
	protected _live_arrows: Map<string, CrimsonArrow<typeof this, T>>;
	protected _base_path: string;

	constructor(quiver: T, base_path: "" | `/${string}` = "", first_arrow: KeyOf<T>) {
		this.quiver = Object.freeze(quiver);
		while (base_path.endsWith("/")) {
			base_path = base_path.substring(0, base_path.length - 1) as `/${string}`;
		}
		base_path = base_path.split("/").map(v => encodeURIComponent(v)).join("/") as `/${string}`;
		this._base_path = base_path;
		this._arrow_id = first_arrow;
		this._prev_arrow_id = this._arrow_id;
		this._live_arrows = new Map();
		const [models, loading] = this._init_(quiver, first_arrow);
		this.models = models;
		this._loading_models = loading;
	}

	private _init_(quiver: T, load_arrow_id?: KeyOf<T>) {
		const models = {} as ArrowModels<T>;
		const loader = new Map<string, Promise<PeasyUIModel>>();
		for (const id of Object.keys(quiver) as KeyOf<T>[]) {
			const arrow = quiver[id];
			arrow.path = this._encode_path_pieces(arrow.path) as `/${string}`;
			if (arrow.loaded) {
				models[id] = arrow.model;
				continue;
			}
			if (load_arrow_id == undefined) {
				continue;
			}
			if (load_arrow_id === "%404%") {
				this._load_model(load_arrow_id);
			}
		}
		return [models, loader] as const;
	}

	private _encode_path_pieces(input: string): string {
		return input.split("/").map(path_piece => {
			if (path_param_regex.test(path_piece)) {
				return path_piece;
			}
			return encodeURIComponent(path_piece);
		}).join("/");
	}

	protected async _load_model(id: KeyOf<T>) {
		if (this._loading_models.has(id)) {
			return await this._loading_models.get(id)!;
		}
		if (id === "%404%") {
			if (!(id in this.quiver)) {
				return Base404Page;
			}
			const arrow = this.quiver[id];
			if (arrow.loaded) {
				return arrow.model;
			}

			const loader = this._loading_models;
			const models = this.models;

			const promise = (async () => {
				const m = await arrow.load();
				models[id] = m;
				// @ts-expect-error
				arrow.loaded = true;
				// @ts-expect-error
				arrow.model = m;
				loader.delete(id);
				return m;
			})();

			loader.set(id, promise);
			return await promise;
		}
		const arrow = this.quiver[id];
		if (arrow.loaded) {
			return arrow.model;
		}
		const loader = this._loading_models;
		const models = this.models;

		const promise = (async () => {
			const m = await arrow.load();
			models[id] = m;
			// @ts-expect-error
			arrow.loaded = true;
			// @ts-expect-error
			arrow.model = m;
			loader.delete(id);
			return m;
		})();

		loader.set(id, promise);
		return await promise;
	}

	async loadDrawnArrow() {
		return await this._load_model(this._arrow_id);
	}

	async pull_from_quiver(arrow_id: KeyOf<T>, params?: ExtraParams) {
		if (!(arrow_id in this.quiver)) {
			this._prev_arrow_id = this._arrow_id;
			this._arrow_id = "%404%" as KeyOf<T>;
			return;
		}
		const arrow = this.quiver[arrow_id];
		history.pushState(null, "", this.arrow_path(arrow_id, params));
		if (!this.models[arrow_id] && !this._loading_models.has(arrow_id)) {
			void await this._load_model(arrow_id);
		}
		if ("on_pulled" in arrow && typeof arrow.on_pulled == "function") {
			const model = this.models[this._arrow_id]!;
			void await arrow.on_pulled({
				model,
				params,
			});
		}
		this._prev_arrow_id = this._arrow_id;
		this._arrow_id = arrow_id;
	}

	// TODO: Properly handle multiple path params
	arrow_path(arrow_id: KeyOf<T>, extra_params?: ExtraParams) {
		const arrow = this.quiver[arrow_id];
		let path = arrow.path;

		if (extra_params && extra_params.path) {
			const path_params = extra_params.path;
			for (const param_name of Object.keys(path_params)) {
				const param_value = path_params[param_name];
				const path_pieces = path.split("/");
				for (let i = 0; i < path_pieces.length; i++) {
					let piece = path_pieces[i];
					if (!piece.includes(`[${param_name}]`)) {
						continue;
					}
					if (Array.isArray(param_value)) {
						// TODO: Keep track of a path param that's used multiple times with different values
						// TODO: Think if this really should be allowed? Maybe not...
						// for (let i = 0; i < param_value.length; i++) {
						// 	const value = param_value[i];
						// 	if (i < param_value.length - 1) {
						// 		piece = piece.replace(`[${param_name}]`, value) as `/${string}`;
						// 	}
						// }
					} else {
						while (piece.includes(`[${param_name}]`)) {
							piece = piece.replace(`[${param_name}]`, param_value) as `/${string}`;
						}
					}
					path_pieces[i] = encodeURIComponent(piece);
				}
				path = path_pieces.join("/") as `/${string}`;
			}
			if (extra_params && extra_params.query) {
				const query_params = extra_params.query;
				let query = "";
				for (const name of Object.keys(query_params)) {
					if (query.length == 0) {
						query += "?";
					} else {
						query += "&";
					}
					const user_value = query_params[name];
					if (typeof user_value == "string") {
						query += `${name}=${encodeURIComponent(user_value)}`;
						continue;
					}
					let first = true;
					for (const value of user_value) {
						if (first) {
							first = false;
						} else {
							query += "&";
						}
						query += `${name}=${encodeURIComponent(value)}`;
					}
				}
				path += query;
			}
		}
		return `${this._base_path}${path}`;
	}

	private create_or_retrieve_arrow = (route_name: KeyOf<T>, message?: string) => {
		if (this._live_arrows.has(route_name)) {
			return this._live_arrows.get(route_name)!;
		}
		const arrow = new CrimsonArrow<typeof this, T>(this, route_name, message);
		this._live_arrows.set(route_name, arrow);
		return arrow;
	};

	is_arrow_live(route_name: KeyOf<T>) {
		return this._live_arrows.has(route_name);
	}

	is_model_loaded(route_name: KeyOf<T>) {
		return route_name in this.models;
	}

	is_model_loading(route_name: KeyOf<T>) {
		return this._loading_models.has(route_name);
	}

	find_arrow_id_by_url(url_path = location.pathname): [KeyOf<T> | "%404%", ExtraParams] {
		for (const id of Object.keys(this.quiver) as KeyOf<T>[]) {
			if (id.startsWith("%") && id.endsWith("%")) {
				continue;
			}
			const arrow = this.quiver[id];
			const path_params: Record<string, string | string[]> = {};
			if (path_param_regex.test(arrow.path)) {
				let correct_id = true;
				const split_arrow_path = arrow.path.split("/");
				const split_url_path = url_path.split("/");
				for (let i = 0; i < split_arrow_path.length; i++) {
					if (i >= split_url_path.length) {
						break;
					}
					const url_piece = split_url_path[i];
					const arr_piece = split_arrow_path[i];
					const found = arr_piece.match(path_param_regex);
					if (!found) {
						if (url_path == arr_piece) {
							continue;
						} else {
							correct_id = false;
							break;
						};
					}
					const param_name = found[1];
					const param_value = decodeURIComponent(url_piece);
					if (param_name in path_params) {
						const prev = path_params[param_name];
						if (Array.isArray(prev)) {
							prev.push(param_value);
							continue;
						}
						path_params[param_name] = [prev, param_value];
						continue;
					}
					path_params[param_name] = param_value;
				}
				if (!correct_id) {
					continue;
				}
				return [id, { path: path_params, query: {} }];
			}
			const arr_path = `${this._base_path}${arrow.path}`;
			if (arr_path != url_path) {
				continue;
			}

			return [id, {}];
		}
		return ["%404%", {}];
	}

	get_arrow(route_name: KeyOf<T>, message?: string) {
		// TODO: Move this to be done when the link is almost or fully visible
		if (!this.is_model_loaded(route_name) && !this.is_model_loading(route_name)) {
			// Start loading the model when a link to it is requested and not loaded/loading yet
			void this._load_model(route_name);
		}
		// Create arrow if it wasn't live before
		const arrow = this.create_or_retrieve_arrow(route_name, message);
		return arrow;
	}

	links_list(arrow_ids: AbsoluteArrowPath<T>[] = this.list_arrow_ids()) {
		const list = [];
		for (const key of arrow_ids) {
			const link = this.get_arrow(key);
			list.push(link);
		}
		return list;
	}

	list_arrow_ids() {
		const all_ids = Object.keys(this.quiver) as KeyOf<T>[];
		const arrow_ids = all_ids.filter(id => {
			return !(id.startsWith("%") || path_param_regex.test(id));
		}) as AbsoluteArrowPath<T>[];
		return arrow_ids;
	}

	get full_path() {
		const arrow = this.quiver[this._arrow_id];
		return `${this._base_path}${arrow.path}`;
	}

	get pulled_arrow() {
		if (this._arrow_id == null) return null;
		const pulled = this.models[this._arrow_id];
		if (!pulled) {
			if (this._arrow_id == "%404%" && !("%404%" in this.models)) {
				return Base404Page;
			}
			return this.models[this._prev_arrow_id];
		}
		return pulled;
	}

	get active_id() {
		return this._arrow_id;
	}

	get template() {
		return CrimsonRanger.template;
	}
}

export class CrimsonArrow<const R extends CrimsonRanger<T>, const T extends Record<string, Route<any>>> {
	static readonly template = `<a href="\${aim}" \${ click @=> _on_click } \${ ==> element }>\${intent}</a>`;
	readonly router: R;
	readonly target: KeyOf<T>;
	readonly aim: string;
	intent: string;
	on_pulled?: (ev: PointerEvent, arrow: CrimsonArrow<R, T>) => any;
	// element property gets set by peasy after it's mounted
	declare readonly element: HTMLAnchorElement;
	declare private _on_click: (event: PointerEvent) => Promise<void>;

	constructor(router: R, target: KeyOf<T>, message?: string) {
		this.router = router;
		this.target = target;
		this.aim = router.arrow_path(target);
		this.intent = message ?? target.replace(/[_-]/g, " ");
		this.on_pulled = undefined;

		this._on_click = async (event: PointerEvent) => {
			event.preventDefault();
			await this.router.pull_from_quiver(this.target);
			if (typeof this.on_pulled != "function") return;
			this.on_pulled(event, this);
		};
	}

	get template() {
		return CrimsonArrow.template;
	}
}

type ElfInstructions<T extends RangerConfig> = {
	path: `/${string}` | "",
	routes: T,
	first_arrow: KeyOf<T>,
};

export function missElf<const T extends RangerConfig>(config: ElfInstructions<T>) {
	const quiver = {} as RangerConfigIntoQuiver<T>;
	const { routes } = config;
	for (const id of Object.keys(routes) as KeyOf<T>[]) {
		const data = routes[id];
		const router = typeof data.model === "function" ? {
			loaded: false,
			path: data.path,
			load: data.model,
		} satisfies DelayedRoute<any> : {
			loaded: true,
			path: data.path ?? "/**/*",
			model: data.model,
		} satisfies LaidRoute<any>;
		// @ts-expect-error
		quiver[id] = router;
	}
	type Q = typeof quiver;
	// @ts-expect-error
	const mistress = new CrimsonRanger<Q>(quiver, config.path, config.first_arrow);
	return mistress;
}
