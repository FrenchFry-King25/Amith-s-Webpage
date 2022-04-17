import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";
//import { getAnalytics } from "./firebase/analytics";


var breaktime = 60
var date = new Date();
var year = date.getFullYear();
var month = date.getMonth() + 1;
var day = date.getDate();
var userInt = 0;
var users;

//const h1 = document.createElement("h1");
let textNode = document.createTextNode(month + "/" + day + "/" + year);
//h1.appendChild(textNode);
document.getElementById("daytitle").appendChild(textNode);

const firebaseConfig = {
  apiKey: "AIzaSyDrxWy3L26piHgM26PPzzZF82ZwQfP1t0s",
  authDomain: "timextra-7113a.firebaseapp.com",
  databaseURL: "https://timextra-7113a-default-rtdb.firebaseio.com",
  projectId: "timextra-7113a",
  storageBucket: "timextra-7113a.appspot.com",
  messagingSenderId: "53736697490",
  appId: "1:53736697490:web:78b6e81e429d6f0211c04b",
  measurementId: "G-VGWZXKM2LB"
};


//default date
const tomorrow = new Date(date)
tomorrow.setDate(tomorrow.getDate() + 1)
document.getElementById("due").defaultValue = tomorrow;


// Get a database reference to our posts
const app = initializeApp(firebaseConfig);
const db = getDatabase(initializeApp(firebaseConfig));
// var users = {};

const starCountRef = ref(db, "users/");
onValue(starCountRef, (snapshot) => {
  var data = snapshot.val();
  //console.log(data);
  var users = Object.values(data);

  //console.log("THIS CODE")
  lookForEmail(users)
});

// click listener
submit.addEventListener('click', (e) => {
  document.getElementById("calendar").innerHTML = "";
  let added = false;
  console.log("CLICKED")
  var name = document.getElementById('name').value;
  var length = document.getElementById('length').value;
  if (document.getElementById('timeUnit').value == 'hr') {
    length *= 60
  }
  var due = document.getElementById('due').value;
  console.log(due)
  var start = document.getElementById('start').value.toString();
  start = start.substring(0, start.indexOf(':')) + "00"
  console.log(start)
  var end = document.getElementById('end').value;

  const starCountRef = ref(db, "users/");
  onValue(starCountRef, (snapshot) => {
    var data = snapshot.val();
    //console.log(data);
    var users = Object.values(data);
    if (!added) {
      added = true;
      console.log("user int: " + userInt);
      console.log("tast: " + Object.keys(users[userInt].tasks).length);
      if (name.length > 0) {
        let taskNum = Object.keys(users[userInt].tasks).length+1;

        set(ref(db, "users/" + userInt + "/tasks/" + taskNum), {
          name: name,
          length: length,
          due: due,
          start: start,
          end: end,
        });
      }
      alert('Saved');
      document.getElementById("calendar").innerHTML = "";
      lookForEmail(users);
    }
    added = false;
  })
});




function lookForEmail(users) {
  var email = "amithpolineni@gmail.com"
  //var email = document.cookie;
  for (const tempuser in users) {
    //console.log(users[tempuser].email)
    if (users[tempuser].email == email) {
      var user = users[tempuser];
      userInt = parseInt(tempuser + 1);
    }
  }
  //console.log("correct user: " + user)


  makeCalendar(user)
}

function writeTime(user) {
  console.log("THIS CODE")
  var times = []
  for (let i = user.start; i <= user.end; i += 100) {
    let time = ""
    let hour = i / 100
    if (hour > 12) {
      hour -= 12
      time += hour + ":00 PM"
    }
    else {
      time += hour + ":00 AM"
    }
    times.push(time)
  }
  //console.log(times)
  return times
}

function writeTasks(user) {
  let tasks = user.tasks
  let array = []
  //console.log(tasks)
  for (const task in tasks) {
    //console.log(tasks[task])
    if ((tasks[task].start == "00" || tasks[task].end == "00") && array.length != 0) {
      let previous = Object.values(array.slice(-1))
      console.log(previous[array.length-1].end)
      let start = previous[array.length-1].end + breaktime
      console.log(start)
      if (start % 100 >= 60) {
        start += 40
      }
      if (start >= 2400) {
        start -= 2400
      }
      tasks[task].start = start
      let end = tasks[task].start + tasks[task].length
      if (end % 100 >= 60) {
        end += 40
      }
      if (end >= 2400) {
        end -= 2400
      }
      tasks[task].end = end
    }
    else if (array.length == 0) {
      tasks[task].start = user.start
      let end = tasks[task].start + tasks[task].length
      if (end % 100 >= 60) {
        end += 40
      }
      if (end >= 2400) {
        end -= 2400
      }
      tasks[task].end = end
    }
    console.log(tasks[task].start)
    array.push(tasks[task])
  }
  //console.log(array)
  return array
}
function makeCalendar(user) {

  let times = writeTime(user)
  let tasks = writeTasks(user)
  let pairs = makePairs(times, tasks, user.start);
  let headingDiv = document.createElement('div')
  headingDiv.setAttribute('class', 'flex flex-row justify-between border-solid border-4 w-3/4')
  let timeHead = document.createElement('div')
  timeHead.setAttribute('class', 'flex font-bold justify-start px-4 w-1/3')
  timeHead.appendChild(document.createTextNode("Time"));
  headingDiv.appendChild(timeHead)
  let nameHead = document.createElement('div')
  nameHead.setAttribute('class', 'flex font-bold justify-center px-4 w-1/3')
  nameHead.appendChild(document.createTextNode("Name"));
  headingDiv.appendChild(nameHead)
  let dateHead = document.createElement('div')
  dateHead.setAttribute('class', 'flex font-bold justify-end px-4 w-1/3')
  dateHead.appendChild(document.createTextNode("Due"));
  headingDiv.appendChild(dateHead)
  document.getElementById("calendar").appendChild(headingDiv);
  //console.log(pairs)
  for (let i = 0; i < pairs.length; i++) {
    let block = document.createElement('div');
    block.setAttribute('class', 'flex flex-row space-y-0 justify-between border-solid border-2');
    let timeDiv = document.createElement('div')
    timeDiv.setAttribute('class', 'flex px-3 w-1/3')
    timeDiv.appendChild(document.createTextNode(pairs[i][0]));
    block.appendChild(timeDiv);
    if (pairs[i][1] != "") {
      let taskDiv = document.createElement('div');
      taskDiv.setAttribute('class', 'flex px-4 font-bold')
      taskDiv.appendChild(document.createTextNode(pairs[i][1].name))
      block.appendChild(taskDiv);
      let dateDiv = document.createElement('div');
      dateDiv.setAttribute('class', 'flex px-4 font-bold')
      dateDiv.appendChild(document.createTextNode(pairs[i][1].due))
      block.appendChild(dateDiv);

      let deleteButton = document.createElement('input')
      deleteButton.setAttribute('id', 'del')
      deleteButton.setAttribute('type', 'submit')
      deleteButton.setAttribute('Name', 'delete')
      deleteButton.setAttribute('value', 'Delete')
      deleteButton.setAttribute('class', 'p-2 px-3 bg-gray-200 rounded-full')
      block.appendChild(deleteButton)

      deleteButton.addEventListener('click', (e) => {
        app.database().ref('users/'+(i+1)).remove()
      })

    }
    else {
      let taskDiv = document.createElement('div');
      taskDiv.appendChild(document.createTextNode(""))
      block.appendChild(taskDiv);
      let dateDiv = document.createElement('div');
      dateDiv.appendChild(document.createTextNode(""))
      block.appendChild(dateDiv);
    }
    
    document.getElementById("calendar").appendChild(block);
  }



}

function makePairs(times, tasks, start) {
  var pairs = [];
  for (let i = 0; i < times.length; i++) {
    let outTime = ""
    let outTask;
    for (let j = 0; j < tasks.length; j++) {
      let time = "";
      let hour = tasks[j].start / 100;
      if (hour > 12) {
        hour -= 12
        time += hour + ":00 PM";
      }
      else {
        time += hour + ":00 AM";
      }
      if (times[i] == time) {
        outTime = time
        outTask = tasks[j]
      }

    }
    console.log(times[i])
    if (times[i] == outTime) {
      pairs.push([times[i], outTask]);
    }
    else {
      pairs.push([times[i], ""]);
    }
  }
  return pairs
}



function newTask(name, length, due, start, end) {
  task = {
    "name": name,
    "length": length,
    "due": due,
    "start": start,
    "end": end,
  }
  return task
}







