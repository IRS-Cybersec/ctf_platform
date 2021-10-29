import React from 'react';
import { Layout, message, Card, Input, Divider, InputNumber, Switch, Button } from 'antd';

class AdminEmails extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            disableLoading: false,
            SMTPHost: "",
            SMTPPort: 587,
            SMTPSecure: false,
            SMTPUser: "",
            SMTPPass: "",
            emailFrom: "",
            websiteLink: "",
            emailSenderAddr: "",
            emailSender: "",
            emailResetTime: 0,
            emailCooldown: 0
        }
    }

    componentDidMount() {
        this.getDisableStates()
    }

    getDisableStates = async () => {
        this.setState({ disableLoading: true })
        await fetch(window.ipAddress + "/v1/email/disableStates", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                //console.log(data)
                this.setState({ emailResetTime: data.states.emailResetTime, emailCooldown: data.states.emailCooldown, emailSenderAddr: data.states.emailSenderAddr, emailSender: data.states.emailSender, websiteLink: data.states.websiteLink, SMTPHost: data.states.host, SMTPPort: data.states.port, SMTPSecure: data.states.secure, SMTPUser: data.states.user, SMTPPass: data.states.pass })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ disableLoading: false })
    }

    testConnection = async () => {
        this.setState({ disableLoading: true })
        await fetch(window.ipAddress + "/v1/email/test", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                message.success("SMTP server connection successful. Ready to send messages :)")
            }
            else {
                message.error("Connection failed. Check console for the complete error object.", 5)
                console.error(data.error)
            }


        }).catch((error) => {
            console.error(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ disableLoading: false })
    }

    changeSetting = async (setting, value) => {
        this.setState({ disableLoading: true })
        let settingName = ""
        if (setting === "SMTPHost") {
            settingName = "SMTP host"
        }
        else if (setting === "SMTPPort") {
            settingName = "SMTP port"
        }
        else if (setting === "SMTPUser") {
            settingName = "SMTP login username"
        }
        else if (setting === "SMTPPass") {
            settingName = "SMTP login password"
        }
        else if (setting === "websiteLink") {
            settingName = "Email website link"
        }
        else if (setting === "emailSender") {
            settingName = "Email sender name"
        }
        else if (setting === "emailSenderAddr") {
            settingName = "Email sender address"
        }
        else if (setting === "emailCooldown") {
            settingName = "Time between emails"
        }
        else if (setting === "emailResetTime") {
            settingName = "Password reset expiry time"
        }
        await fetch(window.ipAddress + "/v1/adminSettings", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                disable: value,
                setting: setting
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                message.success(settingName + " changed to " + value.toString())
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ disableLoading: false })
    }

    disableSetting = async (setting, value) => {

        let settingName = ""
        this.setState({ disableLoading: true })
        if (setting === "SMTPSecure") {
            settingName = "SMTP Secure"
        }
        await fetch(window.ipAddress + "/v1/adminSettings", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                disable: value,
                setting: setting
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {

                if (!value) {
                    message.success(settingName + " disabled")
                }
                else {
                    message.success(settingName + " enabled")
                }
                let setObj = {}
                setObj[setting] = value
                this.setState(setObj)
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ disableLoading: false })
    }




    render() {
        return (

            <Layout style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>
                <h1 style={{ fontSize: "300%" }}>Email Settings</h1>
                <p>
                    The platform requires an SMTP server to use to send emails such as verifications emails and password reset emails. You can also broadcast emails from here to all registered accounts.
                    <br />
                    If you want to enable the "Forgot Password" option or email verifications, please enable it in the <b>Users</b> tab.
                </p>

                <div>
                    <Button type="primary" loading={this.state.disableLoading} onClick={() => { this.testConnection() }}>Test Connection</Button>
                </div>

                <Divider />
                <h1 style={{ fontSize: "150%" }}>SMTP Connection Settings</h1>

                <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                    <Card className="settings-card">
                        <h3>SMTP Host:
                            <Input
                                disabled={this.state.disableLoading}
                                value={this.state.SMTPHost}
                                onChange={(e) => this.setState({ SMTPHost: e.target.value })}
                                onPressEnter={(e) => { this.changeSetting("SMTPHost", this.state.SMTPHost) }} /></h3>
                        <p>Enter the SMTP host address without the protocol (e.g smtp.example.com)</p>
                    </Card>
                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>SMTP Port: <InputNumber
                            value={this.state.SMTPPort}
                            disabled={this.state.disableLoading}
                            onChange={(value) => this.setState({ SMTPPort: value })}
                            onPressEnter={(e) => { this.changeSetting("SMTPPort", this.state.SMTPPort) }} />
                        </h3>
                        <p>Enter the SMTP port</p>
                    </Card>
                </div>

                <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around", marginTop: "2ch" }}>

                    <Card className="settings-card">
                        <h3>SMTP Secure:  <Switch disabled={this.state.disableLoading} onClick={(value) => this.disableSetting("SMTPSecure", value)} checked={this.state.SMTPSecure} /></h3>
                        <p>Use TLS to transfer emails <br /><i>(Note: This option sometimes fails even though you already have TLS setup. If this happens, simply uncheck this option and the connection will later be upgraded to TLS if possible)</i>.</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>SMTP Username: <Input
                            value={this.state.SMTPUser}
                            disabled={this.state.disableLoading}
                            onChange={(e) => this.setState({ SMTPUser: e.target.value })}
                            onPressEnter={(e) => { this.changeSetting("SMTPUser", this.state.SMTPUser) }} />
                        </h3>
                        <p>Enter the SMTP login username</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>SMTP Password:
                            <Input.Password
                                value={this.state.SMTPPass}
                                disabled={this.state.disableLoading}
                                onChange={(e) => this.setState({ SMTPPass: e.target.value })}
                                onPressEnter={(e) => { this.changeSetting("SMTPPass", this.state.SMTPPass) }} />
                        </h3>
                        <p>Enter the SMTP login password</p>
                    </Card>
                </div>

                <Divider />

                <h1 style={{ fontSize: "150%" }}>Email Header Settings</h1>

                <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around", marginTop: "2ch" }}>

                    <Card className="settings-card">
                        <h3>Email Website Link <Input
                            value={this.state.websiteLink}
                            disabled={this.state.disableLoading}
                            onChange={(e) => this.setState({ websiteLink: e.target.value })}
                            onPressEnter={(e) => { this.changeSetting("websiteLink", this.state.websiteLink) }} />
                        </h3>
                        <p>This link will be used to create the password reset/email verification links.</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>Email Sender Name<Input
                            value={this.state.emailSender}
                            disabled={this.state.disableLoading}
                            onChange={(e) => this.setState({ emailSender: e.target.value })}
                            onPressEnter={(e) => { this.changeSetting("emailSender", this.state.emailSender) }} />
                        </h3>
                        <p>This is the name of the email sender when sending emails</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>Email Sender Address<Input
                            value={this.state.emailSenderAddr}
                            disabled={this.state.disableLoading}
                            onChange={(e) => this.setState({ emailSenderAddr: e.target.value })}
                            onPressEnter={(e) => { this.changeSetting("emailSenderAddr", this.state.emailSenderAddr) }} />
                        </h3>
                        <p>
                            This is the <b>full email address</b> of the sender. <br />
                            (<b>Note:</b> The email domain here should <b>match the domain the emails are sent out from</b>. Otherwise, there is a chance that your emails will not reach the user)
                        </p>
                    </Card>
                </div>

                <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around", marginTop: "2ch" }}>

                    <Card className="settings-card">
                        <h3>Time Between Emails <InputNumber
                            value={this.state.emailCooldown}
                            disabled={this.state.disableLoading}
                            onChange={(value) => this.setState({ emailCooldown: value })}
                            onPressEnter={(e) => { this.changeSetting("emailCooldown", this.state.emailCooldown) }} />
                        </h3>
                        <p>This is the minimum time <b>in seconds</b> between password reset/email verification emails that a user has to wait.</p>
                    </Card>

                    <Divider type="vertical" style={{ height: "inherit" }} />

                    <Card className="settings-card">
                        <h3>Password Reset Expiry
                            <InputNumber
                                value={this.state.emailResetTime}
                                disabled={this.state.disableLoading}
                                onChange={(value) => this.setState({ emailResetTime: value })}
                                onPressEnter={(e) => { this.changeSetting("emailResetTime", this.state.emailResetTime) }} />
                        </h3>
                        <p>This is the time <b>in seconds</b> a password reset link lasts till it expires.</p>
                    </Card>
                </div>


            </Layout >
        );
    }
}

export default AdminEmails;