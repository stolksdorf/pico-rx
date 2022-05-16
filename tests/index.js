const rx = require('../');


module.exports = {

	basic: t=>{
		const [foo, {on}] = rx({ a : [
			1,
			2,
			{
				test : true
			},
			'yo'
		]});

		on('*', (evts)=>{
			console.log('HERE')
			console.log({evts})
		})


		let temp = foo.a;


		//foo.a[3] = true;
		foo.a[3] = false;





		// foo.a = [1,2,3,4];

		// temp = foo.a;>

		// console.log('compare', foo.a === temp);

		// console.log(foo.a.isProxy, 'HERE');

		// foo.a = [1,2,3,4];

		// console.log('compare', foo.a === temp);


	},

	del : t=>{
		const [foo, {on}] = rx({
			a : {
				b : true,
				c : {
					d : 5,
					e : 7
				}
			}
		});

		on('*', (evts)=>{
			console.log({evts})
		});



		delete foo.a.c.e;

		console.log(foo)

	},

	immutable : {

		same_obj : (t)=>{
			const [foo] = rx({ a : [1,2,3]});

			const temp = foo.a;

			t.ok(temp === foo.a);

			foo.a.push(5);

			t.ok(temp === foo.a);
		},

		null_edits_do_not_change_ref : (t)=>{
			const [foo] = rx({ a : [1,2,3]});

			const temp = foo.a;

			foo.a = [1,2,3];

			t.ok(foo.a === temp);
		}


	},

	_base_array : t=>{
		const [foo] = rx([1,2,3]);

		console.log(foo)

		console.log(foo[0])

		//TODO: make sure allt he events are working properly
		foo.push(5);

	},

	isProxyChecks : t=>{
		const [foo] = rx({ a : [1,2,3]});

		console.log(Object.keys(foo));
		console.log(JSON.stringify(foo));


	},




}