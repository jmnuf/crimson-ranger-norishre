const router_template = `<div class="norishre-quiver"><\${ pulled_arrow === }></div>` as const;

type Class<T extends {} = any, M extends Record<string, any> = Record<string, any>> = { new(...args: any[]): T; create: (model: M) => T };

type DelayedRoute<TData extends Record<string, any>, C extends Class = Class> = {
	path: `/${string}`;
	Component: C;
	data: TData;
};
type LaidRoute<TData extends { template: string | HTMLTemplateElement }> = {
	path: `/${string}`;
	model: TData;
};

type Route<TData extends Record<string, any> & { template: string | HTMLTemplateElement }, C extends Class = Class> = DelayedRoute<TData, C> | LaidRoute<TData>;

type ArrowModels<T extends Record<string, DelayedRoute<Record<string, any>, Class> | LaidRoute<Record<string, any> & { template: string | HTMLTemplateElement }>>> = {
	[K in keyof T]: T[K] extends DelayedRoute<Record<string, any>, Class<infer Inst>> ? Inst : T[K] extends LaidRoute<infer M> ? M : never;
};

export class Norishre<const T extends Record<string, Route<any>>> {
	readonly quiver: T;
	readonly models: ArrowModels<T>;
	private _arrow_id: `${Exclude<keyof T, symbol>}`;

	constructor(quiver: T, first_arrow?: `${Exclude<keyof T, symbol>}`) {
		this.quiver = Object.freeze(quiver);
		this._arrow_id = first_arrow ? first_arrow : Object.keys(this.quiver)[0] as any;
		this.models = this._get_arrows_models();
	}

	_get_arrows_models(): ArrowModels<T> {
		return {} as any;
	}

	get_quiver_arrow(route_name: keyof T) {
		return new NorishreArrow(this, route_name);
	}

	get pulled_arrow() {
		if (this._arrow_id == null) return null;
		const active = this.quiver[this._arrow_id];
		if ("Component" in active) {
			const model = active.Component.create(active.data);
			this.models[this._arrow_id] = model;
			return model;
		}
		return active.model;
	}
	
	static readonly template = `<div class="norishre-quiver"><\${ active_page === }></div>` as const;
	get template() {
		return Norishre.template;
	}
}

class NorishreArrow<const R extends Norishre<T>, const T extends Record<string, Route<any>>> {
	static readonly template = `<a href="\${aim}" \${ click @=> _on_click } \${ ==> element }>\${intent}</a>`;
	readonly router: R;
	readonly target: keyof T;
	// @ts-expect-error
	readonly element: HTMLAnchorElement;

	constructor(router: R, target: keyof T) {
		this.router = router;
		this.target = target;
	}

	private _on_click(event: PointerEvent) {
		event.preventDefault();
	}
}
