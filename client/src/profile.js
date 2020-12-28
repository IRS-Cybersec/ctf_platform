import React from 'react';
import { Layout, message, Empty, Divider, Avatar, Table, Button, Modal, Form, Input } from 'antd';
import { animated } from 'react-spring/renderprops';
import { AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid, Label, ResponsiveContainer } from "recharts";
import { Ellipsis } from 'react-spinners-css';
import { orderBy } from "lodash";
import {
    KeyOutlined,
    FileUnknownTwoTone
} from '@ant-design/icons';
import './App.css';

const { Column } = Table;

const ChangePasswordForm = (props) => {
    const [form] = Form.useForm();

    return (
        <Form
            form={form}
            name="changePassword"
            className="change-password-form"
            onFinish={(values) => { props.resetPassword(values) }}
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", marginBottom: "2vh" }}
        >
            <h3>Old Password:</h3>
            <Form.Item
                name="oldPass"
                rules={[{ required: true }]}>

                <Input.Password allowClear placeholder="Enter your old password." />
            </Form.Item>
            <h3>New Password:</h3>
            <Form.Item
                name="newPassword"
                rules={[
                    {
                        required: true,
                        message: 'Please input your new password',
                    },
                ]}
                hasFeedback
            >

                <Input.Password allowClear placeholder="Enter a new password" />
            </Form.Item>

            <h3>Confirm New Password:</h3>
            <Form.Item
                name="confirm"
                dependencies={['newPassword']}
                hasFeedback
                rules={[
                    {
                        required: true,
                        message: 'Please retype your new password to confirm',
                    },
                    ({ getFieldValue }) => ({
                        validator(rule, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject('Oops, the 2 passwords do not match');
                        },
                    }),
                ]}
            >

                <Input.Password allowClear placeholder="Confirm new password" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" icon={<KeyOutlined />}>Change Password</Button>
            </Form.Item>
        </Form>
    );
}

class Profile extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            solved: [],
            score: 0,
            width: 0,
            height: 0,
            challenges: [],
            targetUser: "",
            loading: true,
            userScore: "Loading...",
            graphData: [],
            passwordChangeModal: false
        }
    }

    componentDidMount() {
        const startup = async () => {
            await this.setState({ loading: true })
            const username = this.props.match.params.user;
            if (typeof username !== "undefined") {
                await this.setState({ targetUser: username })
            }
            else {
                await this.setState({ targetUser: this.props.username })
            }
            await this.unpackChallengesData();
        };
        startup();
    }

    resetPassword(values) {
        fetch(window.ipAddress + "/v1/account/password", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                "password": values.oldPass,
                "new_password": values.newPassword,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            console.log(data)

            if (data.success === true) {
                message.success({ content: "Password changed successfully." })
                this.setState({ passwordChangeModal: false })
            }
            else if (data.error === "wrong-password") {
                message.error({ content: "Old password is incorrect. Please try again." })
            }
            else {
                message.error({ content: "Oops. Unknown error." })
            }

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    //Marvel in glory at the hideous mess of tangled backend handling.
    //Gawk at the terrible use of index-based for loops when streams exist now
    //Try, and fail, to interpret the sheer rubbish that is this method.
    //But it works. And that is enough for me to bury it forever.
    //- Leonard.
    unpackChallengesData() {
        fetch(window.ipAddress + "/v1/scoreboard/" + this.state.targetUser, {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            console.log(data)
            if (data.success === true) {
                let challengeDS = []
                let challengeArray = orderBy(data.scores, ["timestamp"], ["desc"])
                let challengeArrayReversed = orderBy(data.scores, ["timestamp"], ["asc"])
                let graphData = []
                let graphPoint = {}
                let scoreTotal = 0

                for (let x = 0; x < challengeArray.length; x++) {
                    //Plot graph
                    scoreTotal += challengeArrayReversed[x].points
                    graphPoint = {
                        Score: scoreTotal,
                        Time: new Date(challengeArrayReversed[x].timestamp).toLocaleString("en-US", { timeZone: "Asia/Singapore" })
                    }
                    graphData.push(graphPoint)

                    //Handle table
                    let currentDS = {
                        key: String(x),
                        challenge: "",
                        score: "",
                        time: ""
                    }
                    const currentStuff = challengeArray[x]
                    //Current record is a hint
                    if (currentStuff.type === "hint") {
                        currentDS.challenge = "Purchased Hint For: " + currentStuff.challenge
                    }
                    else {
                        currentDS.challenge = currentStuff.challenge
                    }
                    currentDS.score = currentStuff.points
                    const dateTime = Math.abs(new Date() - new Date(currentStuff.timestamp)) / 1000 //no. of seconds since the challenge was completed/hint bought
                    let minutes = Math.ceil(dateTime / 60)
                    let hours = 0
                    let days = 0
                    let months = 0
                    let years = 0
                    if (minutes >= 60) {
                        hours = Math.floor(minutes / 60)
                        minutes = minutes - hours * 60

                        if (hours >= 24) {
                            days = Math.floor(hours / 24)
                            hours = hours - days * 24

                            if (days >= 30) {
                                months = Math.floor(days / 30)
                                days = days - months * 30

                                if (months >= 12) {
                                    years = Math.floor(months / 12)
                                    months = months - years * 12
                                }
                            }
                        }
                    }
                    let finalTime = " ago."
                    if (minutes !== 0) {
                        finalTime = minutes.toString() + " minutes " + finalTime
                    }
                    if (hours !== 0) {
                        finalTime = hours.toString() + " hours " + finalTime
                    }
                    if (days !== 0) {
                        finalTime = days.toString() + " days " + finalTime
                    }
                    if (months !== 0) {
                        finalTime = months.toString() + " months " + finalTime
                    }
                    if (years !== 0) {
                        finalTime = years.toString() + " years " + finalTime
                    }
                    currentDS.time = finalTime

                    challengeDS.push(currentDS)
                }

                //push finalPoint
                graphPoint = {
                    Score: scoreTotal,
                    Time: new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" })
                }
                graphData.push(graphPoint)

                console.log(this.state.targetUser)

                fetch(window.ipAddress + "/v1/scores/" + this.state.targetUser, {
                    method: 'get',
                    headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    console.log(data)

                    if (data.success === true) {
                        this.setState({ userScore: data.score, scores: challengeDS, graphData: graphData, loading: false })
                    }
                    else if (data.success === false && data.error === "not-found") {
                        this.setState({ userScore: "Hidden", scores: [], graphData: [], loading: false })
                    }
                    else {
                        message.error({ content: "Oops. Unknown error" })
                    }

                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
            }
            else if (data.success == false) {
                fetch(window.ipAddress + "/v1/scores/" + this.state.targetUser, {
                    method: 'get',
                    headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    console.log(data)

                    if (data.success === true) {
                        this.setState({ userScore: data.score, scores: [], graphData: [], loading: false })
                    }
                    else if (data.success === false && data.error === "not-found") {
                        this.setState({ userScore: "Hidden", scores: [], graphData: [], loading: false })
                    }
                    else {
                        message.error({ content: "Oops. Unknown error" })
                    }

                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
            }

            else { //Guess we'll die.
                console.log("not found")
                this.setState({ targetUser: false })
                message.error({ content: "Something went wrong fetching your challenges." })
            }
        }).catch((error) => {
            console.log(error);
            message.error({ content: "Something went wrong fetching your challenges." })
        })
    }

    render() {
        return (
            <animated.div style={{ ...this.props.transition, height: "100vh", overflowY: "auto", backgroundColor: "rgba(0, 0, 0, 0.7)", border: "5px solid transparent", borderRadius: "20px" }}>
                <Layout style={{ margin: "20px", backgroundColor: "rgba(0, 0, 0, 0)" }}>

                    <Modal title="Change Password" visible={this.state.passwordChangeModal} onCancel={() => { this.setState({ passwordChangeModal: false }) }} footer={null}>
                        <ChangePasswordForm resetPassword={this.resetPassword.bind(this)} />
                    </Modal>

                    {this.state.loading && (
                        <div style={{ position: "absolute", left: "50%", transform: "translate(-50%, 0%)", zIndex: 10 }}>
                            <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                        </div>
                    )}
                    {
                        !this.state.targetUser && !this.state.loading && (
                            <Layout style={{ height: "100%", width: "100%" }}>
                                <br /><br /><br />
                                <Empty>That user doesn't exist</Empty>
                            </Layout>
                        )
                    }
                    {
                        this.state.targetUser && !this.state.loading && (
                            <Layout style={{ height: "100%", width: "100%", padding: "3%", backgroundColor: "rgba(0, 0, 0, 0)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex" }}>
                                        <div style={{ display: "flex", marginRight: "5ch", alignItems: "center", justifyItems: "center" }}>
                                            <Avatar style={{ backgroundColor: "Red", marginRight: "3ch", width: "10ch", height: "10ch" }} size='large' src="https://www.todayifoundout.com/wp-content/uploads/2017/11/rick-astley.png" />
                                            <h1 style={{ fontSize: "5ch" }}>{this.state.targetUser}</h1>
                                        </div>
                                        <div>
                                            <h1 style={{ fontSize: "5ch", color: "#faad14" }}><span style={{ color: "#d48806", fontSize: "1.5ch" }}><u>Score:</u> </span>{this.state.userScore}</h1>
                                        </div>
                                    </div>
                                    {this.state.targetUser !== this.props.username && (
                                        <div>
                                            <Button size="large" style={{ backgroundColor: "#1f1f1f" }} onClick={() => { this.setState({ passwordChangeModal: true }) }}>Change Password</Button>
                                        </div>
                                    )}
                                </div>
                                <Divider />
                                <h1 style={{ fontSize: "3ch" }}>Score History</h1>
                                <div style={{ height: 375, width: "100%", backgroundColor: "rgba(0, 0, 0, 0.3)", border: "5px solid transparent", borderRadius: "20px", padding: "10px", margin: "10px" }}>
                                    <ResponsiveContainer width="90%" height={350}>
                                        <AreaChart height={350} data={this.state.graphData}
                                            margin={{ top: 10, right: 15, left: 15, bottom: 15 }}>

                                            <defs>
                                                <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#791a1f" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f89f9a" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="Time">
                                                <Label offset={-5} position="insideBottom" style={{ fill: 'rgba(207, 207, 207, 1)' }}>
                                                    Time
                                                    </Label>
                                            </XAxis>
                                            <YAxis >
                                                <Label offset={-10} position='insideLeft' style={{ fill: 'rgba(207, 207, 207, 1)' }}>
                                                    Score
                                                </Label>
                                            </YAxis>
                                            <CartesianGrid strokeDasharray="3 3" />

                                            <Tooltip labelStyle={{ backgroundColor: "#1c2b3e" }} contentStyle={{ backgroundColor: "#1c2b3e" }} wrapperStyle={{ backgroundColor: "#1c2b3e" }} />
                                            <Area isAnimationActive={false} type="monotone" dataKey="Score" stroke="#d32029" fillOpacity={1} fill="url(#color1)" />
                                        </AreaChart>
                                    </ResponsiveContainer>

                                </div>
                                <div style={{ height: "70%", width: "100%", minWidth: "80vw" }}>
                                    <Table style={{ marginTop: "2vh" }} dataSource={this.state.scores} pagination={{ pageSize: 10 }} locale={{
                                        emptyText: (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                                <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                                <h1 style={{ fontSize: "200%" }}>{this.state.targetUser} has not completed any challenges/bought any hints</h1>
                                            </div>
                                        )
                                    }}>
                                        <Column width={1} title="Challenge/Hint" dataIndex="challenge" key="challenge" />
                                        <Column width={30} title="Score Change" dataIndex="score" key="score" />
                                        <Column width={30} title="Timestamp" dataIndex="time" key="time" />
                                    </Table>
                                </div>
                            </Layout>

                        )
                    }
                </Layout>
            </animated.div>
        )
    }
}




export default Profile;
