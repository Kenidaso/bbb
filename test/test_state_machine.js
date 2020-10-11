
const StateMachine = require('javascript-state-machine');

// let fsm = new StateMachine({
//   init: 'solid',
//   transitions: [
//     { name: 'melt',     from: 'solid',  to: 'liquid' },
//     { name: 'freeze',   from: 'liquid', to: 'solid'  },
//     { name: 'vaporize', from: 'liquid', to: 'gas'    },
//     { name: 'condense', from: 'gas',    to: 'liquid' }
//   ],

//   methods: {
//     onMelt:     function() { console.log('I melted')    },
//     onFreeze:   function() { console.log('I froze')     },
//     onVaporize: function() { console.log('I vaporized') },
//     onCondense: function() { console.log('I condensed') }
//   }
// });

// console.log('-->', fsm.state);             // 'solid'
// fsm.vaporize();
// // fsm.melt();
// console.log('-->', fsm.state);             // 'liquid'
// fsm.vaporize();
// console.log('-->', fsm.state);             // 'gas'


let FSM = StateMachine.factory({
  // init: 'PURCHASED',

  transitions: [
    { name: 'init', from: '*', to: function (status) { return initStatus.bind(this)(status) }},

    { name: 'purchase', from: '*', to: 'PURCHASED' },
    { name: 'donate', from: 'PURCHASED', to: 'DONATED' },
    { name: 'receive', from: '*', to: 'RECEIVED' },
  ],

  data: function (status) {      //  <-- use a method that can be called for each instance
    this.init(status);
  },

  methods: {
    describe: function() {
      console.log('Status is ' + this.status);
    },

    onInit: function (e) {
      console.log('Go init ...');
    },

    onPurchase: function(e) {
      console.log('Go purchase ...');
    },

    onDonate: function() {
      console.log('Go donate ...');
    },

    onReceive: function() {
      console.log('Go receive ...');
    },
  }
});


function initStatus (status) {
  let allStates = this.allStates();
  let DEFAULT_STATE = 'PURCHASED';

  status = status || DEFAULT_STATE;
  status = status.toUpperCase();

  if (allStates.indexOf(status) > -1) return status;
  return DEFAULT_STATE;
}

let a = new FSM(null);

console.log('-->', a.state);

a.donate();
console.log('-->', a.state);
