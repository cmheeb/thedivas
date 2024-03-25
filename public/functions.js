const regForm = document.getElementById('reg-form');
regForm.addEventListener('submit', regUser);

async function regUser(event) {
    event.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    const result = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password,
            confirmPassword
        })
    }).then((res) => res.json());

    if(result.status == 'ok') {

    } else {
        alert(result.error);
    }
};

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
    console.log('LOGIN', result);

    if(result.status == 'ok') {
        document.getElementById("user-credentials").innerHTML = `Hello, ${username}!`;
    } else {
        alert(result.error);
    }

};

async function checkAuth() {
    const result = await fetch('/auth').then((res) => res.json());
    console.log('AUTH', result)

    if(result.status == 'ok') {
        document.getElementById("user-credentials").innerHTML = `Hello, ${result.username}!`;
    } else {
        
    }

}

window.onload = checkAuth;