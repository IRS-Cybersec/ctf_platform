import React from 'react';
import { Layout, message, Button, Table, Modal, Form, Input, Avatar, Divider } from 'antd';
import { AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid, Label, ResponsiveContainer } from "recharts";
import { Ellipsis } from 'react-spinners-css';
import orderBy from 'lodash.orderby'
import {
    TeamOutlined,
    LinkOutlined,
    UsergroupAddOutlined,
    IdcardOutlined,
    FileUnknownTwoTone
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Column } = Table;
const { confirm } = Modal;

const CreateTeamForm = (props) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = React.useState(false)

    return (
        <Form
            form={form}
            name="createTeam"
            onFinish={async (values) => {
                setLoading(true)
                await fetch(window.ipAddress + "/v1/team/create", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "name": values.name,
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Created the team " + values.name + " successfully!" })
                        form.resetFields()
                        props.setState({ createTeamModal: false })
                    }
                    else {
                        message.error({ content: "Oops. Unknown error." })
                    }

                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
                setLoading(false)
            }}
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%" }}
        >
            <h3>Team Name:</h3>
            <Form.Item
                name="name"
                rules={[
                    {
                        required: true,
                        message: 'Please input a team name',
                    },
                ]}
            >

                <Input icon={<IdcardOutlined />} allowClear placeholder="Enter a team name" />
            </Form.Item>

            <Form.Item>
                <Button style={{ marginRight: "1.5vw" }} onClick={() => { props.setState({ createTeamModal: false }) }}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<UsergroupAddOutlined />} loading={loading}>Create Team</Button>
            </Form.Item>
        </Form>
    );
}

class Teams extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            inviteName: "",
            loading: true,
            teamName: false,
            code: "",
            members: [],
            createTeamModal: false,
            notFound: false,
            joinLoading: false,
            teamScore: "Loading...",
            graphData: [],
            scores: []
        }
    }

    componentDidMount() {
        const code = this.props.match.params.code
        if (typeof code !== "undefined") {
            this.getCodeDetails(code)
        }
        else {
            const team = this.props.match.params.team
            if (typeof team !== "undefined") { // User is viewing another team
                this.loadTeamDetails(team)
            }
            else if (this.props.team) { // Load own team if user is in a team
                this.loadTeamDetails(this.props.team)
            } // User is not in any team
            else this.setState({ loading: false })
        }
    }

    joinTeam = async (name, code, close) => {
        this.setState({ joinLoading: true })
        await fetch(window.ipAddress + "/v1/team/join", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                code: code
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success) {
                message.success("Successfully joined the team.")
                this.loadTeamDetails(name)
                close()
            }
            else if (data.error === "invalid-code") {
                message.error("Unknown invite code. The team might no longer exist.")
            }
            else if (data.error === "in-team") {
                message.error("You are already in a team. Please leave your existing team to join this team")
            }
            else if (data.error === "team-full") {
                message.error("This team is full and is unable to take anymore members.")
            }
            else if (data.error === "teams-disabled") {
                message.error("Teams are disabled")
            }
            else {
                message.error("Unknown error.")
            }

        }).catch((error) => {
            console.log(error);
            message.error({ content: "Something went wrong fetching your challenges." })
        })
        this.setState({ joinLoading: true })
    }

    loadTeamDetails = async (team) => {
        await fetch(window.ipAddress + "/v1/team/info/" + encodeURIComponent(team), {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success) {
                this.setState({ teamName: team, code: data.code, members: data.members })
                this.unpackTeamTransactions(data.changes)
            }
            else {
                if (data.error === "not-found") {
                    message.error("No team with the name " + team + " was found.")
                    this.setState({ notFound: true })
                }
                else if (data.error === "teams-disabled") {
                    message.error("Teams are disabled")
                }
                else {
                    message.error("Unknown error.")
                }

            }


        }).catch((error) => {
            console.log(error);
            message.error({ content: "Something went wrong fetching your challenges." })
        })

    }

    unpackTeamTransactions = async (changes) => {
        let challengeDS = []
        let challengeArray = orderBy(changes, ["timestamp"], ["desc"])
        let challengeArrayReversed = orderBy(changes, ["timestamp"], ["asc"])
        let graphData = []
        let graphPoint = {}
        let scoreTotal = 0

        graphData.push({
            Score: 0,
            Time: "0"
        })

        for (let x = 0; x < challengeArray.length; x++) {
            //Plot graph
            scoreTotal += challengeArrayReversed[x].points
            graphPoint = {
                Score: scoreTotal,
                Time: new Date(challengeArrayReversed[x].timestamp).toLocaleString("en-US", { timeZone: "Asia/Singapore" })
            }
            graphData.push(graphPoint)

            //Handle table
            const currentStuff = challengeArray[x]
            let currentDS = {
                key: String(x),
                challenge: "",
                score: currentStuff.points,
                time: "",
                challengeID: "",
                username: currentStuff.author
            }
            
            //Current record is a hint
            if (currentStuff.type === "hint") currentDS.challenge = "Purchased Hint For: " + currentStuff.challenge
            else currentDS.challenge = currentStuff.challenge
            if ("challengeID" in currentStuff) currentDS.challengeID = currentStuff.challengeID
            //console.log(currentStuff.timestamp)
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
        this.setState({ teamScore: scoreTotal, graphData: graphData, scores: challengeDS, loading: false })
        //console.log(graphData)
    }

    getCodeDetails = async (code) => {
        await fetch(window.ipAddress + "/v1/team/linkInfo", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                code: code
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success) {
                this.setState({ inviteName: data.name })
                confirm({
                    title: "Team Invite Link",
                    content: <span>Do you want to join the team: <b><u>{data.name}</u></b>?</span>,
                    icon: <UsergroupAddOutlined />,
                    maskClosable: true,
                    okText: "Join Team",
                    confirmLoading: this.state.joinLoading,
                    onOk: (close) => { this.joinTeam(data.name, code, close) },
                    onCancel: () => { },
                });
            }
            else if (data.error === "invalid-code") {
                message.error("Unknown invite code. The team might no longer exist.")
            }
            else if (data.error === "in-team") {
                message.error("You are already in a team. Please leave your existing team to join this team")
            }
            else if (data.error === "team-full") {
                message.error("This team is full and is unable to take anymore members.")
            }
            else if (data.error === "teams-disabled") {
                message.error("Teams are disabled")
            }
            else {
                message.error("Unknown error.")
            }

        }).catch((error) => {
            console.log(error);
            message.error({ content: "Something went wrong fetching your challenges." })
        })
        this.props.history.push("/Team")
        this.setState({ loading: false })
    }

    render() {
        return (
            <Layout className="layout-style">

                <Modal
                    title={<span>Create New Team <UsergroupAddOutlined /></span>}
                    visible={this.state.createTeamModal}
                    footer={null}
                    onCancel={() => { this.setState({ createTeamModal: false }) }}
                >
                    <CreateTeamForm setState={this.setState.bind(this)} />
                </Modal>

                {this.state.loading ? (
                    <div style={{ position: "absolute", left: "55%", transform: "translate(-55%, 0%)", zIndex: 10 }}>
                        <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                    </div>
                ) : (
                    <div>
                        {this.props.team === "teams-disabled" ? (
                            <div style={{ display: "flex", placeContent: "center center", textAlign: "center", fontSize: "130%", width: "100%", height: "100%" }}>
                                <div>
                                    <TeamOutlined style={{ fontSize: "600%", color: "#177ddc" }} />
                                    <div>
                                        <h1>It seem's like teams are disabled.</h1>
                                        <p>If you believe this is an error, please contact the admins.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {this.state.notFound ? (
                                    <div style={{ display: "flex", placeContent: "center center", textAlign: "center", fontSize: "130%", width: "100%", height: "100%" }}>
                                        <div>
                                            <TeamOutlined style={{ fontSize: "600%", color: "#177ddc" }} />
                                            <div>
                                                <h1>We were unable to find this team.</h1>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {this.state.teamName ?
                                            (
                                                <Layout style={{ height: "100%", width: "100%", padding: "3%", backgroundColor: "rgba(0, 0, 0, 0)" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div style={{ display: "flex" }}>
                                                            <div style={{ display: "flex", marginRight: "5ch", alignItems: "center", justifyItems: "center" }}>
                                                                <Avatar style={{ backgroundColor: "transparent", marginRight: "3ch", width: "10ch", height: "10ch" }} size='large' src={"/static/profile/" + this.state.targetUser + ".webp"} />
                                                                <h1 style={{ fontSize: "5ch" }}>{this.state.teamName}</h1>
                                                            </div>
                                                            <div>
                                                                <h1 style={{ fontSize: "5ch", color: "#faad14" }}><span style={{ color: "#d48806", fontSize: "1.5ch" }}><u>Team Score:</u> </span>{this.state.teamScore}</h1>
                                                            </div>
                                                        </div>
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
                                                    <div style={{ height: "70%", width: "100%" }}>
                                                        <Table style={{ marginTop: "2vh" }} dataSource={this.state.scores} pagination={{ pageSize: 10 }} locale={{
                                                            emptyText: (
                                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                                                    <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                                                    <h1 style={{ fontSize: "200%" }}>{this.state.targetUser} has not completed any challenges/bought any hints</h1>
                                                                </div>
                                                            )
                                                        }}>
                                                            <Column width={30} title="Username" dataIndex="username" key="username"
                                                             render={(text, row, index) => {
                                                                return <Link to={"/Profile/" + text}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                                                            }}
                                                            />
                                                            <Column width={1} title="Challenge/Hint" dataIndex="challenge" key="challenge"
                                                                render={(text, row, index) => {
                                                                    if (row.challengeID !== "") return <Link to={"/Challenges/" + row.challengeID}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                                                                    else return (<span>{text}</span>);
                                                                }} />
                                                            <Column width={30} title="Score Change" dataIndex="score" key="score" />
                                                            <Column width={30} title="Solved Timestamp" dataIndex="time" key="time" />
                                                        </Table>
                                                    </div>
                                                </Layout>

                                            ) :
                                            (
                                                <div style={{ display: "flex", placeContent: "center center", textAlign: "center", fontSize: "130%", width: "100%", height: "100%" }}>
                                                    <div>
                                                        <TeamOutlined style={{ fontSize: "600%", color: "#177ddc" }} />
                                                        <div>
                                                            <h1>The world's a dangerous place</h1> <h2>Don't go alone, join/create a team today!</h2>
                                                        </div>
                                                        <Button icon={<UsergroupAddOutlined />} type="primary" size="large" onClick={() => { this.setState({ createTeamModal: true }) }}>Create a Team</Button>
                                                        <p style={{ marginTop: "3ch" }}>Got an <b>invite link <LinkOutlined /></b>? Simply paste it in the address bar to join the team!</p>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </div>
                                )}
                            </div>

                        )}

                    </div>
                )}

            </Layout>
        )
    }
}




export default Teams;
