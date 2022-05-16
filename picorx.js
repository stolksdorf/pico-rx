const isSame = (obj1, obj2)=>{
	if(obj1 === obj2) return true;
	if(typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
	const keys1 = Object.keys(obj1), keys2 = Object.keys(obj2);
	if(keys1.length !== keys2.length) return false;
	return keys1.every((key)=>isSame(obj1[key], obj2[key]));
};
const AsyncEmitter = (delay=0)=>{
	let events = new Set(), timer;
	const emitter = {
		active    : false,
		listeners : {},
		emit : (evt)=>{
			if(!emitter.active) return;
			events.add(evt);
			if(!timer){
				timer = setTimeout(()=>{
					const evts = [...events];
					events.clear();
					delete timer;
					evts.map(evt=>{if(emitter.listeners[evt]){ emitter.listeners[evt].map(fn=>fn()); }});
					if(emitter.listeners['*']) emitter.listeners['*'].map(fn=>fn(evts));
				}, delay);
			}
		},
		on : (evt, fn)=>{
			emitter.listeners[evt] = (emitter.listeners[evt]||[]).concat(fn);
			return ()=>emitter.listeners[evt] = emitter.listeners[evt].filter(x=>x!==fn);
		}
	};
	return emitter;
};

module.exports = (init={}, delay=0)=>{
	const emitter = AsyncEmitter(delay);
	const getPaths = (curr, key)=>curr.length==0 ? [key] : curr.concat(curr[curr.length-1] + '.' + key);
	const create = (init, paths=[])=>{
		const prox = new Proxy(Array.isArray(init) ? [] : {} , {
			set : (target, key, value)=>{
				if(!isSame(target[key], value)){
					target[key] = (typeof value !== 'object') ? value : create(value, getPaths(paths, key));
					getPaths(paths, key).map(emitter.emit);
				}
				return true;
			},
			deleteProperty : (target, key)=>{
				if(typeof target[key] === 'undefined') return true;
				Reflect.deleteProperty(target, key);
				getPaths(paths, key).map(emitter.emit);
				return true;
			}
		});
		Object.entries(init).map(([k,v])=>prox[k]=v);
		return prox;
	};
	const obj = create(init);
	const get = (path)=>path.split('.').reduce((acc, key)=>((typeof acc !== 'undefined') ? acc[key] : acc), obj);
	emitter.active = true;
	return [obj, emitter, get];
};