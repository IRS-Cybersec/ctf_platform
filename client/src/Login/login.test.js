// some stuff has already been imported in setupTests.js
import { render, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom';
import Login from './login.js'
import { screen, prettyDOM } from '@testing-library/dom'
import { act } from 'react-dom/test-utils';

describe('<Login />', () => {
    let component;

    // this is ran BEFORE EACH TEST below
    beforeEach(() => {
        component = render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>) // artificially renders the component in Jest
    })

    // Each of these below are a "TEST"
    // some examples use "it". They are the same
    test("Login Page Rendered", () => {
        expect(component.container).toHaveTextContent('Sign In')
        // "container" property contains all the HTML inside the component
        // searching for text content "Sign In"
    })

    test("Register Page Tests", async () => {
        const registerButton = component.container.querySelector('#register-toggle')
        fireEvent.click(registerButton)

        expect(component.container).toHaveTextContent('Register an Account')
    })


    test("Forgot Password Page Rendered", () => {
        const forogtPass = component.container.querySelector('#forgot-password')
        fireEvent.click(forogtPass)

        expect(component.container).toHaveTextContent('Forgot Password')
    })
})
