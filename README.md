# 🔄 pico-rx

> Tiny, event-y, and pseudo-immutable proxy for Javascript objects

Inspired by [RxJS](https://rxjs.dev/)


### Features
- Converts Javascript objects into "pseudo-immutable" (reference stable) and eventy objects using proxys
- Any update or delete to the object fires events
- Updating a property with the same value, does not fire events and does not update the property reference
- No depndacies
- Only 60 LoC


If you've done any React development, in particular apps with a central [Flux-like](https://www.javatpoint.com/react-flux-concept) data store, the framework and boilerplate around having a central state, not firing duplicate update events, and quickly/performantly having components check to see if they should update; is quite the task.

There are a ton of big libraries out there: [Redux](https://redux.js.org/), [Recoil](https://recoiljs.org/), [MobX](https://mobx.js.org/README.html). I have found these to have a very high learning curve, come with more features than you usually need, and usually change the way you would normally write your components/app.

I wanted to create a simple drop-in utility that gave me events and equality checks without creating a bunch of new functions or methods to learn.


### How to use

`pico-rx` takes an array or object, and returns a three-value array. First value being a proxied version of the input, the second being an event emitter, and the third is a convenice method for getting values from the object using string notation, eg. `users.0.name`.

```js
const rx = require('./pico-rx.js');

// Wrap an existing object
const [Data, Emitter, Get] = rx({
	users : [
		{ name : 'Bob', valid : true },
		{ name : 'Alice', valid : false },
	],
	count : 50
});

//Access the object as normal
console.log(Data.users[0].name);

// Can use the 'Get' function to access parts of the object using string notation
const BobsName = Get('users.0.name');


//Create listeners
Emitter.on('count', ()=>{
	//Fires whenever 'Data.count' changes value or is deleted
	console.log('count has changed!')
});

// '*' is special in that it gets a list of all update events, and fires whenever anything changes
Emitter.on('*', (events)=>{
	console.log(events);
});

// You can even listen to built-in properties changing
const unsub = Emitter.on('users.length', ()=>{
	console.log('The number of users has changed!')
});

// Creating a listener returns an 'off' or 'unsubscribe' function
unsub(); // user length listener is removed.


Data.count = 50; //Fires no events
Data.count = 49; //Triggers the 'count' and the '*' listeners


// If an assignment does not change the true value of an object, pico-rx will not update it's reference,
// meaning you can use === to test if changes happened very performantly and intutively

const Bob = Data.users[0];

Data.users[0].name = 'Bob'; // No events fired
Data.users[0] === Bob; // true since nothing has changed


// Since the value of users[0] is set to the exact same contents, no event is fired
// and no reference is updated.
Data.users[0] = {
	name : 'Bob',
	valid : true
};
Data.users[0] === Bob; // still true, Since the data within Bob is exactly the same


Data.users[0].valid = false; // Fires 'users.0.valid', 'users.0', 'users', and '*' events;
Data.users[0] === Bob; // false!! Since something within the Bob object has changed.
```



### Emitter Object

The Emitter in `pico-rx` is a "batch" emitter, so it waits a very short period before triggering listeners. So you can update a value many many times in quick succession, and the Emitter will only fire one update event.

The Emitter is also a "stepped" emitter, so if you update a nested property it fires update events for all objects above it. eg. `Data.users[0].name = 'bar';`, will fire events: `"users.0.name", "users.0", "users", "*"`;

```js
Emitter = {
	active : true,  //Toggle to turn off the emitter, useful to toggle for big updates
					// without overwhelming your listeners
	listeners : {},  //A map of event & array of listener functions. Can edit directly.
	emit : (event)=>{}, // Fire an event manually
	on : (event, func)=>{}, // Adds a listener function to a specific event. Returns an 'off' function.
}
```


### Use with React (and react-like libraries)

Using `pico-rx` it's really easy to set up central objects in your app that keep a consistent state for your components. Since `pico-rx` uses proxies, interacting with the wrapped objects is the same as native Javascript, so you don't need to learn any new functions or syntax.


```jsx

const [Store, Emitter] = require('./pico-rx.js')({
	counters : {
		alpha : { count : 0, active : true },
		beta : { count : 0, active : true },
	}
});


const Counter = function(counterId){
	const [counter, setCounter] = React.useState(Store.counters[counterId]);

	React.useEffect(()=>{
		return Emitter.on(`counters.${counterId}`, ()=>{
			// Since the object reference will only change if there were actual changes
			// this helps limit the number of unneeded re-renders without in component checks
			setCounter(Store.counters[counterId]);
		});
	}, []);

	return <button
		disabled={counter.active}
		onClick={()=>counter.count++}>
			{counterId}
	</button>;
};

//These two components will stay up to date with eachother without explicitly linking them.
const CounterDisplay = function(counterId){
	const [counter, setCounter] = React.useState(Store.counters[counterId]);

	React.useEffect(()=>{
		return Emitter.on(`counters.${counterId}`, ()=>{
			setCounter(Store.counters[counterId]);
		});
	}, []);

	return <div>
		{counterId} => {counter.count}
		<input
			type="checkbox"
			checked={counter.active}
			onClick={()=>counter.active = !counter.active}
			></input>
	</div>
};
```

### Hooks

Using the `Getter` function is pretty easy to create a hook to make the components even simpler

```jsx
const [Store, Emitter, Get] = require('./pico-rx.js')({
	counters : {
		alpha : { count : 0, active : true },
		beta : { count : 0, active : true },
	}
});

const useStore = (valuePath)=>{
	const [obj, setObj] = React.useState(Get(valuePath));
	React.useEffect(()=>{
		return Emitter.on(valuePath, ()=>setObj(Get(valuePath)));
	}, []);
	return obj;
};

const Counter = function(counterId){
	const counter = useStore(`counters.${counterId}`);
	return <button
		disabled={counter.active}
		onClick={()=>counter.count++}>
			{counterId}
	</button>;
};

// ....

```


