const regForm = document.getElementById('reg-form');
regForm.addEventListener('submit', regUser);

async function regUser(event) {
    event.preventDefault();
    const userfield = document.getElementById('reg-username');
    const passfield = document.getElementById('reg-password');
    const passconfield = document.getElementById('reg-confirm-password');

    const result = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: userfield.value,
            password: passfield.value,
            confirmPassword: passconfield.value
        })
    }).then((res) => res.json());

    if(result.status == 'ok') {
        userfield.value = '';
        passfield.value = '';
        passconfield.value = '';
    } else {
        alert(result.error);
    }
};

let loggedin = false;

const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', login);

async function login(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const result = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password
        })
    }).then((res) => res.json());
    console.log('LOGIN', result.username);

    if(result.status == 'ok') {
        loggedin = true;
        await checkAuth();
        document.getElementById("user-credentials").innerHTML = `<div id="logout">Hello, ${result.username}! <form><input type="submit" value="Logout"></form></div>`;
        const logoutForm = document.getElementById('logout');
        logoutForm.addEventListener('submit', logout);    
    } else {
        alert(result.error);
    }

};

async function checkAuth() {
    if(loggedin) {
       loggedin = false;
       return; 
    }

    const result = await fetch('/auth').then((res) => res.json());
    console.log('AUTH', result)

    if(result.status == 'ok') {
        document.getElementById("user-credentials").innerHTML = `<div id="logout">Hello, ${result.username}! <form><input type="submit" value="Logout"></form></div>`;
        const logoutForm = document.getElementById('logout');
        logoutForm.addEventListener('submit', logout);
    } else {

    }

}

async function logout() {
    const result = await fetch('/logout').then((res) => res.json());
    console.log('logout', result);

    if(result.status == 'ok') {
        document.getElementById("user-credentials").innerHTML = "Logout work"
    }

}

window.onload = checkAuth;