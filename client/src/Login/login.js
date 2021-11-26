import React from 'react';
import { Input, Button, Layout, Form, Checkbox, message } from 'antd';
import {
    UserOutlined,
    LockOutlined,
    MailOutlined,
    QuestionCircleOutlined,
    RightCircleOutlined,
    LeftCircleOutlined
} from '@ant-design/icons';
import { Ellipsis } from 'react-spinners-css';

const { Content } = Layout


class Login extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            failedLogin: false,
            errorFetch: false,
            login: true,
            register: false,
            loading: false,
            forgotPass: false,
            forgotPassReset: false,
            forgotPassUsername: "",
            forgotPassResetLoading: false,
            code: "",
            needVerify: false,
            verifyEmail: "",
            verifyEmailLoading: false
        };
    }

    componentDidMount() {
        let index = window.location.pathname.indexOf("/reset/password/")
        if (index !== -1) {
            this.setState({ forgotPassReset: true, login: false, forgotPassResetLoading: true })
            const pathSplit = window.location.pathname.slice(index, window.location.pathname.length).split("/")
            if (pathSplit.length < 4) message.error("Invalid link. Please check that you have entered the link correctly.")
            else this.checkResetPasswordLink(pathSplit[3], pathSplit[4])
        }
        else {
            index = window.location.pathname.indexOf("/verify/")
            if (index !== -1) {
                this.setState({ needVerify: true, verifyEmailLoading: true, login: false })
                const pathSplit = window.location.pathname.slice(index, window.location.pathname.length).split("/")
                if (pathSplit.length < 4) message.error("Invalid link. Please check that you have entered the link correctly.")
                else this.handleEmailVerify(pathSplit[2], pathSplit[3])
            }
        }
    }

    handleRegister = values => {
        this.setState({ loading: true })
        fetch(window.ipAddress + "/v1/account/create", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "username": values.username,
                "password": values.password,
                "email": values.email
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "Woohoo! Successfully registered, you can now login via the login screen!" })

            }
            else if (data.error === "email-verify") {
                message.success("Woohoo! Successfully registered!")
                message.info("We now require you to verify your email " + data.emailVerify + " before being able to log into the platform", 10)
                this.setState({ needVerify: true, verifyEmail: data.emailVerify, register: false })
            }
            else if (data.error === "email-taken") {
                message.warn({ content: "Oops. Email already taken" })
            }
            else if (data.error === "username-taken") {
                message.warn({ content: "Oops. Username already taken" })
            }
            else if (data.error === "registration-disabled") {
                message.error("Oops. Registration is currently disabled, please contact an administrator for help.")
            }
            else if (data.error === "email-formatting") {
                message.error({ content: "Oops. Your email has not been registered for Sieberrsec CTF yet, please register using the form." })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }

            this.setState({ loading: false })


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting to the server" });
            this.setState({ loading: false })
        })
    }

    handleLogin = values => {
        this.setState({ loading: true })
        fetch(window.ipAddress + "/v1/account/login", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "username": values.username,
                "password": values.password,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then(async (data) => {
            //console.log(data)
            if (data.success === true) {
                await this.props.handleLogin(data.token, data.permissions, values.remember)
            }
            else {

                if (data.error === "wrong-details") {
                    message.error({ content: "Oops. Your username/email or password was incorrect." })
                }
                else if (data.error === "need-verify") {
                    message.info("Please verify your email in order to login to the platform.", 10)
                    this.setState({ login: false, needVerify: true, verifyEmail: data.emailVerify })
                }
                else if (data.error === "login-disabled") {
                    message.error({ content: "Oops. Login is disabled for non-admin users." })
                }
                else {
                    message.error({ content: "Oops. Unknown error" })
                }

            }
            this.setState({ loading: false })

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting to the server" })
            this.setState({ loading: false })
        })
    }

    handleForgot = values => {
        this.setState({ loading: true })
        fetch(window.ipAddress + "/v1/account/forgot/pass", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "email": values.email
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then(async (data) => {
            //console.log(data)
            if (data.success === true) {
                message.success("Request sent successfully.")
            }
            else {
                if (data.error === "disabled") message.error({ content: "Oops. It seems like the forgot password function is disabled." })
                else message.error({ content: "Oops. Unknown error" })
            }
            this.setState({ loading: false })

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting to the server" })
            this.setState({ loading: false })
        })
    }

    checkResetPasswordLink = async (username, code) => {
        await fetch(window.ipAddress + "/v1/account/forgot/check", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "code": code,
                "username": username
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                this.setState({ forgotPassUsername: username, code: code })
            }
            else {
                if (data.error === "invalid-code") {
                    message.error("Oops. It seems like the link might have expired.")
                }
                else if (data.error === "disabled") message.error({ content: "Oops. It seems like the forgot password function is disabled." })
                else message.error({ content: "Oops. Unknown error" })
                this.setState({ forgotPassReset: false, login: true })
            }

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting to the server" });
        })
        this.setState({ forgotPassResetLoading: false })
        window.history.pushState({}, "", "/");
    }

    handleResetPasword = async (values) => {
        this.setState({ loading: true })
        await fetch(window.ipAddress + "/v1/account/forgot/reset", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "code": this.state.code,
                "username": this.state.forgotPassUsername,
                "password": values.password
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success("Password successfully changed. You can now login using the new password.")
                this.setState({ login: true, forgotPassReset: false })
            }
            else {
                if (data.error === "invalid-code") {
                    message.error("Oops. It seems like the link might have expired.")
                }
                else if (data.error === "disabled") message.error({ content: "Oops. It seems like the forgot password function is disabled." })
                else message.error({ content: "Oops. Unknown error" })
            }

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting to the server" });
        })
        this.setState({ loading: false })
    }

    handleEmailVerify = async (username, code) => {
        this.setState({ loading: true, verifyEmailLoading: true })
        await fetch(window.ipAddress + "/v1/account/verify", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "username": username,
                "code": code
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then( async (data) => {
            //console.log(data)
            if (data.success === true) {
                message.success("Email successfully verified!")
                await this.props.handleLogin(data.token, data.permissions, true)
            }
            else {
                if (data.error === "disabled") {
                    message.error("Oops. It seems like the email verification function is disabled.", 5)
                    message.info("You may simply proceed to login without verifying your email.", 5)
                    this.setState({ needVerify: false, login: true })
                }
                else if (data.error === "login-disabled") {
                    message.success("Email successfully verified!")
                    message.warn("Login is currently disabled for non-admin users so we couldn't log you in automatically.")
                    this.setState({ needVerify: false, login: true })
                }
                else if (data.error === "already-verified") {
                    message.info("This email is already verified. You may proceed to login", 5)
                    this.setState({ needVerify: false, login: true })
                }
                else if (data.error === "invalid-code") {
                    message.error("Oops. Invalid email verification code")
                    this.setState({ needVerify: false, login: true })
                }
                else message.error({ content: "Oops. Unknown error" })
            }

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting to the server" });
        })
        this.setState({ loading: false, verifyEmailLoading: false })
        window.history.pushState({}, "", "/");
    }

    handleResendVerification = async (email) => {
        this.setState({ loading: true })
        await fetch(window.ipAddress + "/v1/account/verify/resend", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "email": email,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success("Email verification link resent!")
            }
            else {
                if (data.error === "disabled") {
                    message.error("Oops. It seems like the email verification function is disabled.", 5)
                    message.info("You may simply proceed to login without verifying your email.", 5)
                    this.setState({ needVerify: false, login: true })
                }
                else if (data.error === "already-verified") {
                    message.info("This email is already verified. You may proceed to login", 5)
                    this.setState({ needVerify: false, login: true })
                }
                else if (data.error === "too-recent") {
                    message.error("Oops. It seems like an email verifcation email was just sent", 5)
                    message.info("You will be able to send another email in " + data.waitTime, 5)
                }
                else message.error({ content: "Oops. Unknown error" })
            }

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting to the server" });
        })
        this.setState({ loading: false })
    }

    render() {

        return (

            <Layout style={{ maxWidth: "100vw", maxHeight: "100vh" }}>
                <Content style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0, 0, 0, 0)", backgroundImage: "url(" + require("./../assets/mainBG.webp").default + ")" }}>
                    <div className="login-banner login-banner-responsive">
                        <div style={{ fontSize: "7ch", color: "#595959" }}>
                            <span style={{ fontWeight: "500", textShadow: '1px -1px 1px -1px #000000' }}>Sieberrsec Training Platform</span>
                        </div>
                        <div style={{ color: "#595959", fontSize: "5ch" }}>
                            <p style={{ textShadow: '1px 1px 1px 1px #000000' }}>The Wheel. Reinvented.™</p>
                        </div>
                    </div>


                    <div className="login-page login-page-responsive">
                        <div style={{ padding: "15px", marginBottom: "5vh" }}>
                            <img src={require("./../assets/sieberrsec_ctf.svg").default} style={{ width: "100%" }}></img>
                        </div>
                        {this.state.login && (
                            <div style={{ width: "98%" }}>
                                <h1 style={{ color: "white", fontSize: "3ch" }}>Sign In</h1>
                                <Form
                                    name="normal_login"
                                    className="login-form"
                                    initialValues={{ remember: true }}
                                    onFinish={this.handleLogin}
                                    style={{ width: "95%" }}
                                >
                                    <Form.Item
                                        name="username"
                                        rules={[{ required: true, message: 'Please enter your username/email' }]}
                                    >
                                        <Input allowClear prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Username/Email" />
                                    </Form.Item>
                                    <Form.Item
                                        name="password"
                                        rules={[{ required: true, message: 'Please enter your password.' }]}
                                    >
                                        <Input
                                            prefix={<LockOutlined className="site-form-item-icon" />}
                                            type="password"
                                            placeholder="Password"
                                            allowClear
                                        />
                                    </Form.Item>
                                    <Form.Item >
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                                <Checkbox>Remember me</Checkbox>
                                            </Form.Item>

                                            <a href="#" onClick={() => { this.setState({ login: false, forgotPass: true }) }}><b>I forgot my password <QuestionCircleOutlined /></b></a>
                                        </div>
                                    </Form.Item>

                                    <Form.Item>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginRight: "2ch" }} loading={this.state.loading}>Log in</Button>
                                            <span>Or <a href="#" onClick={() => { this.setState({ login: false, register: true }) }} ><b>Register now <RightCircleOutlined /></b></a></span>
                                        </div>
                                    </Form.Item>
                                </Form>
                            </div>
                        )}
                        {this.state.register && (
                            <div style={{ width: "98%" }}>
                                <h1 style={{ color: "white", fontSize: "3ch" }}>Register an Account</h1>
                                <Form
                                    name="register_form"
                                    className="register-form"
                                    onFinish={this.handleRegister}
                                    style={{ width: "95%" }}
                                    requiredMark="optional"
                                >
                                    <Form.Item
                                        name="username"
                                        rules={[{ required: true, message: 'Please enter a username' }, { message: "Please enter an alphanumeric username (without spaces)", pattern: /^[a-zA-Z0-9_]+$/ }]}
                                    >
                                        <Input allowClear prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Enter a new username" />
                                    </Form.Item>

                                    <Form.Item
                                        name="email"
                                        rules={[{ required: true, message: 'Please enter an email' },
                                        {
                                            type: 'email',
                                            message: "Please enter a valid email",
                                        }]}
                                    >
                                        <Input allowClear prefix={<MailOutlined />} placeholder="Enter a new email" />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please input your password!',
                                            },
                                        ]}
                                        hasFeedback
                                    >
                                        <Input.Password allowClear prefix={<LockOutlined />} placeholder="Enter a new password" />
                                    </Form.Item>

                                    <Form.Item
                                        name="confirm"
                                        dependencies={['password']}
                                        hasFeedback
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please confirm your password!',
                                            },
                                            ({ getFieldValue }) => ({
                                                validator(rule, value) {
                                                    if (!value || getFieldValue('password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject('Oops, the 2 passwords do not match');
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password allowClear prefix={<LockOutlined />} placeholder="Confirm new password" />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button loading={this.state.loading} type="primary" htmlType="submit" className="login-form-button" style={{ marginBottom: "1.5vh" }}>Register</Button>

                                        <p>Already have an account? <a href="#" onClick={() => { this.setState({ login: true, register: false }) }}><b>Login Here <LeftCircleOutlined /></b></a></p>
                                    </Form.Item>
                                </Form>
                            </div>
                        )}
                        {this.state.forgotPass && (
                            <div style={{ width: "98%" }}>
                                <h1 style={{ color: "white", fontSize: "3ch" }}>Forgot Password</h1>
                                <Form
                                    onFinish={this.handleForgot}
                                    style={{ width: "95%" }}
                                >
                                    <Form.Item
                                        name="email"
                                        rules={[{ required: true, message: 'Please enter your email' }, { type: "email", message: "Please enter a valid email" }]}
                                    >
                                        <Input allowClear prefix={<MailOutlined />} placeholder="Email" />
                                    </Form.Item>
                                    <p>
                                        If an account associated with the email above exists, you will receive a password reset email in your inbox <br /><br />
                                        Please note that there is a limit on how often password reset emails can be requested per user. A new email will <b>not be sent if you have just requested for one</b>.

                                    </p>

                                    <Form.Item>
                                        <div style={{ display: "flex", alignItems: "center", marginTop: "4ch" }}>
                                            <Button type="primary" htmlType="submit" style={{ marginRight: "2ch" }} loading={this.state.loading}>Send Email</Button>
                                            <span>Or <a href="#" onClick={() => { this.setState({ login: true, forgotPass: false }) }} ><b>Remember your password? <LeftCircleOutlined /></b></a></span>
                                        </div>
                                    </Form.Item>
                                </Form>
                            </div>
                        )}
                        {this.state.forgotPassReset && (
                            <div style={{ width: "98%" }}>
                                {this.state.forgotPassResetLoading ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                                        <h1>Loading Link Details</h1>
                                        <Ellipsis color="#177ddc" size={120} />
                                    </div>
                                ) : (
                                    <div>
                                        <h1 style={{ color: "white", fontSize: "3ch" }}>Reset Password</h1>
                                        <h4>Resetting password for <u>{this.state.forgotPassUsername}</u></h4>
                                        <Form
                                            onFinish={this.handleResetPasword}
                                            style={{ width: "95%" }}
                                        >

                                            <Form.Item
                                                name="password"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: 'Please input your password',
                                                    },
                                                ]}
                                                hasFeedback
                                            >
                                                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Enter a new password" />
                                            </Form.Item>

                                            <Form.Item
                                                name="confirm"
                                                dependencies={['password']}
                                                hasFeedback
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: 'Please confirm your password',
                                                    },
                                                    ({ getFieldValue }) => ({
                                                        validator(rule, value) {
                                                            if (!value || getFieldValue('password') === value) {
                                                                return Promise.resolve();
                                                            }
                                                            return Promise.reject('Oops, the 2 passwords do not match');
                                                        },
                                                    }),
                                                ]}
                                            >
                                                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Confirm new password" />
                                            </Form.Item>

                                            <Form.Item>
                                                <div style={{ display: "flex", alignItems: "center", marginTop: "4ch" }}>
                                                    <Button type="primary" htmlType="submit" style={{ marginRight: "2ch" }} loading={this.state.loading}>Reset Password</Button>
                                                    <span>Or <a href="#" onClick={() => { this.setState({ login: true, forgotPass: false, forgotPassReset: false }) }} ><b>Remember your password? <LeftCircleOutlined /></b></a></span>
                                                </div>
                                            </Form.Item>
                                        </Form>
                                    </div>
                                )}
                            </div>
                        )}
                        {this.state.needVerify && (
                            <div style={{ width: "98%" }}>
                                {this.state.verifyEmailLoading ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                                        <h1>Verifying Email</h1>
                                        <Ellipsis color="#177ddc" size={120} />
                                    </div>
                                ) : (
                                    <div >
                                        <h1 style={{ color: "white", fontSize: "3ch" }}>Email Verification Required</h1>
                                        <p>
                                            Hi, we require you to <b>verify your email (<code>{this.state.verifyEmail}</code>)</b> in order to login to the platform. Please check your inbox and click on the verification link sent to you.
                                            <br /><br />
                                            Did not receive an email? You can resend a verficiation email below!
                                            <br />

                                            Please note that there is a limit on how often verification emails can be sent per user.
                                        </p>
                                        <Button type="primary" icon={<MailOutlined />} loading={this.state.loading} onClick={() => { this.handleResendVerification(this.state.verifyEmail) }}>Resend Verification</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Content>
            </Layout>
        );
    }
}

export default Login;
