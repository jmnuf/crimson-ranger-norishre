type PeasyUIModel = { template: string | HTMLTemplateElement } & Record<string | number | symbol, unknown>;

type DelayedRoute<TData extends PeasyUIModel> = {
	path: `/${string}`;
	loaded: false,
	load: () => Promise<TData>;
};
type LaidRoute<TData extends PeasyUIModel> = {
	path: `/${string}`;
	loaded: true,
	model: TData;
};

type Route<TData extends PeasyUIModel> = DelayedRoute<TData> | LaidRoute<TData>;

type ArrowModels<T extends Record<string, DelayedRoute<PeasyUIModel> | LaidRoute<PeasyUIModel>>> = {
	[K in keyof T]: T[K] extends DelayedRoute<infer R> ? R | undefined : T[K] extends LaidRoute<infer M> ? M : never;
};

type KeyOf<T> = `${Exclude<keyof T, symbol>}`;
type NorishreQuiver = Record<string, Route<any>> & { "%404%"?: Route<PeasyUIModel> };

export class Norishre<const T extends NorishreQuiver> {
	readonly quiver: T;
	readonly models: ArrowModels<T>;
	private _arrow_id: KeyOf<T>;
	private _prev_arrow_id: KeyOf<T>;
	private _loading_models: Map<string, Promise<PeasyUIModel>>;
	private _base_path: string;

	constructor(quiver: T, base_path:"" | `/${string}` = "", first_arrow?: KeyOf<T>) {
		this.quiver = Object.freeze(quiver);
		while (base_path.endsWith("/")) {
			base_path = base_path.substring(0, base_path.length - 1) as `/${string}`;
		}
		this._base_path = base_path;
		this._arrow_id = this.find_arrow_id_by_url() as KeyOf<T>;
		this._prev_arrow_id = this._arrow_id;
		const [models, loading] = this._init_(quiver, first_arrow);
		this.models = models;
		this._loading_models = loading;
	}

	async pull_from_quiver(arrow_id: KeyOf<T>) {
		const arrow = this.quiver[arrow_id];
		history.pushState(null, "", arrow.path);
		if (!this.models[arrow_id] && !this._loading_models.has(arrow_id)) {
			this._load_model(arrow_id);
		}
		this._prev_arrow_id = this._arrow_id;
		this._arrow_id = arrow_id;
	}

	private _init_(quiver: T, load_arrow_id?: KeyOf<T>) {
		const models = {} as ArrowModels<T>;
		const loader = new Map<string, Promise<PeasyUIModel>>();
		for (const id of Object.keys(quiver) as KeyOf<T>[]) {
			const arrow = quiver[id];
			if (arrow.loaded) {
				models[id] = arrow.model;
				continue;
			}
			if (load_arrow_id == undefined) {
				continue;
			}
			if (load_arrow_id == id) {
				loader.set(id, (async () => {
					const m = await arrow.load();
					models[id] = m;
					// @ts-expect-error
					arrow.loaded = true;
					// @ts-expect-error
					arrow.model = m;
					loader.delete(id);
					return m;
				})());
			}
		}
		return [models, loader] as const;
	}

	private _load_model(id: KeyOf<T>) {
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
		return promise;
	}

	arrow_path(arrow_id: KeyOf<T>) {
		const arrow = this.quiver[arrow_id];
		return `${this._base_path}${arrow.path}`;
	}

	find_arrow_id_by_url() {
		const url_path = location.pathname;
		for (const id of Object.keys(this.quiver) as KeyOf<T>[]) {
			const arrow = this.quiver[id];
			const arr_path = `${this._base_path}${arrow.path}`;
			if (arr_path != url_path) {
				continue;
			}

			return id;
		}
		return "%404%";
	}

	new_link(route_name: KeyOf<T>, message?: string) {
		return new NorishreArrow<typeof this, T>(this, route_name, message);
	}

	links_list() {
		const list = [];
		for (const key of Object.keys(this.quiver) as KeyOf<T>[]) {
			const link = this.new_link(key);
			list.push(link);
		}
		return list;
	}

	get full_path() {
		return `${this._base_path}${this._arrow_id}`;
	}

	get pulled_arrow() {
		if (this._arrow_id == null) return null;
		const pulled = this.models[this._arrow_id];
		if (!pulled) {
			if (this._arrow_id == "%404%") {
				return { template: `<div><h1>404 Error: Page not found</h1><h2>Something is missing...</h2></div>` };
			}
			return this.models[this._prev_arrow_id];
		}
		return pulled;
	}
	
	static readonly template = `<div class="norishre-quiver"><\${ active_page === }></div>` as const;
	get template() {
		return Norishre.template;
	}
}

class NorishreArrow<const R extends Norishre<T>, const T extends Record<string, Route<any>>> {
	static readonly template = `<a href="\${aim}" \${ click @=> _on_click } \${ ==> element }>\${intent}</a>`;
	readonly router: R;
	readonly target: KeyOf<T>;
	readonly aim: string;
	intent: string;
	// This gets set by peasy after it's mounted
	declare readonly element: HTMLAnchorElement;
	declare private _on_click: (event: PointerEvent) => Promise<void>

	constructor(router: R, target: KeyOf<T>, message?: string) {
		this.router = router;
		this.target = target;
		this.aim = router.arrow_path(target);
		this.intent = message ?? target.replace(/[_-]/g, " ");

		this._on_click = async (event: PointerEvent) => {
			event.preventDefault();
			await this.router.pull_from_quiver(this.target);
		};
	}

	get template() {
		return NorishreArrow.template;
	}
}
