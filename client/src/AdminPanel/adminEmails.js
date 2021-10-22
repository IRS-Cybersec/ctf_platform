import React from 'react';
import { Layout, message, Card, Input, Divider, InputNumber, Switch, Form } from 'antd';

class AdminEmails extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            disableLoading: false,
            SMTPHost: "",
            SMTPPort: 587,
            SMTPSecure: false,
            SMTPUser: "",
            SMTPPass: ""
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
                this.setState({ SMTPHost: data.states.host, SMTPPort: data.states.port, SMTPSecure: data.states.secure, SMTPUser: data.states.user, SMTPPass: data.states.pass })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
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
        this.setState({ disableLoading: false})
    }




    render() {
        return (

            <Layout style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>
                <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                    <Card className="settings-card">
                        <h3>SMTP Host:
                            <Input
                                disabled={this.state.disableLoading}
                                value={this.state.SMTPHost}
                                onChange={(e) => this.setState({ uploadPath: e.target.value })}
                                onPressEnter={(e) => { this.changeSetting("SMTPHost", this.state.uploadPath) }} /></h3>
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

                <Divider />

                <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                    <Card className="settings-card">
                        <h3>SMTP Secure:  <Switch disabled={this.state.disableLoading} onClick={(value) => this.disableSetting("SMTPSecure", value)} checked={this.state.SMTPSecure} /></h3>
                        <p>Use TLS to transfer emails (TLS must be setup on your SMTP server, otherwise this will fail).</p>
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
                        <h3>SMTP Password:<Input
                            value={this.state.SMTPPass}
                            disabled={this.state.disableLoading}
                            onChange={(e) => this.setState({ SMTPPass: e.target.value })}
                            onPressEnter={(e) => { this.changeSetting("SMTPPass", this.state.SMTPPass) }} />
                        </h3>
                        <p>Enter the SMTP login password</p>
                    </Card>
                </div>
            </Layout >
        );
    }
}

export default AdminEmails;