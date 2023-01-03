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
    FileUnknownTwoTone,
    WarningOutlined
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
                        props.loadTeamDetails(values.name)
                        props.setTeam(values.name)
                        props.obtainScore()
                        props.setState({ createTeamModal: false })
                    }
                    else if (data.error === "name-taken") {
                        message.error("Team name has been taken. Please select another name.")
                    }
                    else if (data.error === "in-team") {
                        message.error("Already in a team. Please leave your team to create a new team")
                    }
                    else if (data.error === "same-name-as-user") {
                        message.error("The team name you have chosen is the same as a username. Please choose another name instead.")
                    }
                    else if (data.error === "team-full") {
                        message.error("This team is full and is unable to take anymore members.")
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
                        message: 'Please input a valid team name that is alphanumeric with spaces or underscores and is less <= 25 characters',
                        pattern: /^[a-zA-Z0-9_ ]{1,25}$/
                    },
                ]}
            >

                <Input icon={<IdcardOutlined />}  allowClear placeholder="Enter a team name" />
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
        this.copyLinkRef = React.createRef();
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
            scores: [],
            userScores: [],
            leaveLoading: false
        }
    }

    componentDidUpdate(prevProps) {
        if (window.location.pathname.toLowerCase() === "/team" && prevProps.team !== this.props.team) {
            if (this.props.team === false) {
                this.setState({ loading: false })
            }
            else if (this.props.team !== "loading") this.loadTeamDetails(this.props.team) // Sometimes the main component does not load this.props.team before the component mounts. Hence it fails to load the user's team on page refresh
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
            else if (this.props.team && this.props.team != "loading") { // Load own team if user is in a team
                this.loadTeamDetails(this.props.team)
            } // User is not in any team
            else if (this.props.team === false) {
                this.setState({ loading: false })
            }
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
                this.props.setTeam(name)
                this.loadTeamDetails(name)
                this.props.obtainScore()
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
            else if (data.error === "team-change-disabled") {
                message.error("Changing of teams (creating/leaving/joining) of teams have been disabled.")
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

    leaveTeam = async (close) => {
        this.setState({ leaveLoading: true })
        await fetch(window.ipAddress + "/v1/team/leave", {
            method: 'post',
            headers: { "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success) {
                this.setState({ teamName: false })
                message.success("Successfully left the team.")
                if (data.msg && data.msg === "last-member") message.info("Since you were the last member, the team will be disbanded.")
                this.props.setTeam(false)
                this.props.obtainScore()
                close()
            }
            else if (data.error === "not-in-any-team") {
                message.error("You are not in any team. Please refresh the page to see if you are still in a team.")
            }

            else if (data.error === "team-change-disabled") {
                message.error("Changing of teams (creating/leaving/joining) of teams have been disabled.")
            }
            else {
                message.error("Unknown error.")
            }

        }).catch((error) => {
            console.log(error);
            message.error({ content: "Something went wrong fetching your challenges." })
        })
        this.setState({ leaveLoading: true })
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

                else if (data.error === "team-change-disabled") {
                    message.error("Changing of teams (creating/leaving/joining) of teams have been disabled.")
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
        let userScores = {}
        let scoreTotal = 0

        graphData.push({
            Score: 0,
            Time: "0"
        })

        for (let x = 0; x < challengeArray.length; x++) {
            if (challengeArrayReversed[x].points !== 0) {
                //Plot graph
                scoreTotal += challengeArrayReversed[x].points
                if (challengeArrayReversed[x].originalAuthor in userScores) userScores[challengeArrayReversed[x].originalAuthor] += challengeArrayReversed[x].points
                else userScores[challengeArrayReversed[x].originalAuthor] = challengeArrayReversed[x].points

                graphPoint = {
                    Score: scoreTotal,
                    Time: new Date(challengeArrayReversed[x].timestamp).toLocaleString("en-US", { timeZone: "Asia/Singapore" })
                }
                graphData.push(graphPoint)
            }

            if (challengeArray[x].points !== 0) {
                //Handle table
                const currentStuff = challengeArray[x]
                let currentDS = {
                    key: String(x),
                    challenge: "",
                    score: currentStuff.points,
                    time: "",
                    challengeID: "",
                    username: currentStuff.originalAuthor
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
        }

        //push finalPoint
        graphPoint = {
            Score: scoreTotal,
            Time: new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" })
        }
        graphData.push(graphPoint)

        // convert userScores from object to array
        let userScoreArray = []
        for (const user in userScores) {
            userScoreArray.push({
                key: user,
                username: user,
                score: userScores[user]
            })
        }

        this.setState({ teamScore: scoreTotal, graphData: graphData, scores: challengeDS, loading: false, userScores: userScoreArray })
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
                    <CreateTeamForm setState={this.setState.bind(this)} obtainScore={this.props.obtainScore.bind(this)} loadTeamDetails={this.loadTeamDetails.bind(this)} setTeam={this.props.setTeam.bind(this)} />
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
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2ch" }}>
                                                        <div style={{ display: "flex" }}>
                                                            <div style={{ display: "flex", marginRight: "5ch", alignItems: "center", justifyItems: "center" }}>
                                                                <Avatar.Group
                                                                    maxCount={3}
                                                                >
                                                                    {this.state.members.map((member) => {
                                                                        return (
                                                                            <Avatar style={{ backgroundColor: "transparent", marginRight: "3ch", width: "10ch", height: "10ch" }} size='large' src={"/static/profile/" + member + ".webp"} />
                                                                        )
                                                                    })}

                                                                </ Avatar.Group>
                                                                <h1 style={{ fontSize: "5ch" }}>{this.state.teamName}</h1>
                                                            </div>
                                                            <div>
                                                                <h1 style={{ fontSize: "5ch", color: "#faad14" }}><span style={{ color: "#d48806", fontSize: "1.5ch" }}><u>Team Score:</u> </span>{this.state.teamScore}</h1>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {this.state.teamName === this.props.team && (
                                                        <div style={{ backgroundColor: "rgba(0, 0, 0, 0.3)", border: "5px solid transparent", borderRadius: "20px", width: "fit-content", padding: "20px" }}>
                                                            <h4 style={{ fontSize: "2ch", color: "#49aa19" }}>You are part of this team</h4>
                                                            <div style={{ marginTop: "2ch" }}>
                                                                <div style={{ display: "flex", marginBottom: "2ch" }}>
                                                                    <Input value={window.location.origin + "/Team/Join/" + this.state.code} />
                                                                    <Button type="primary" style={{ marginLeft: "1ch" }} icon={<LinkOutlined />} onClick={async () => {
                                                                        await navigator.clipboard.writeText(window.location.origin + "/Team/Join/" + this.state.code);
                                                                        message.success("Invite link copied to clipboard.")

                                                                    }}>Copy Invite Link</Button>
                                                                </div>
                                                                <Button style={{ marginRight: "1ch" }} danger type="primary" onClick={() => {
                                                                    confirm({
                                                                        title: "Leave Team?",
                                                                        content: <span>Are you sure you want to leave: <b><u>{this.state.teamName}</u></b>?</span>,
                                                                        icon: <WarningOutlined />,
                                                                        maskClosable: true,
                                                                        okText: "Leave Team",
                                                                        confirmLoading: this.state.joinLoading,
                                                                        onOk: (close) => { this.leaveTeam(close) },
                                                                        onCancel: () => { },
                                                                    });
                                                                }}>Leave Team</Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <Divider />
                                                    <h1 style={{ fontSize: "3ch" }}>Individual Member's Scoring</h1>
                                                    <Table style={{ marginTop: "2vh" }} dataSource={this.state.userScores} pagination={{ pageSize: 10 }} locale={{
                                                        emptyText: (
                                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                                                <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                                                <h1 style={{ fontSize: "200%" }}>{this.state.teamName} has not completed any challenges/bought any hints</h1>
                                                            </div>
                                                        )
                                                    }}>
                                                        <Column width={30} title="Username" dataIndex="username" key="username"
                                                            render={(text, row, index) => {
                                                                return <Link to={"/Profile/" + text}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                                                            }}
                                                        />
                                                        <Column width={30} title="Total Score" dataIndex="score" key="score" />
                                                    </Table>
                                                    <Divider />
                                                    <h1 style={{ fontSize: "3ch" }}>Team Score History</h1>
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
                                                    <Table style={{ marginTop: "2vh" }} dataSource={this.state.scores} pagination={{ pageSize: 10 }} locale={{
                                                        emptyText: (
                                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                                                <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                                                <h1 style={{ fontSize: "200%" }}>{this.state.teamName} has not completed any challenges/bought any hints</h1>
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
                                                        <div style={{ marginTop: "3ch" }}>
                                                            <span>Got an <b>invite link <LinkOutlined />?</b></span>
                                                            <div>
                                                                <Button style={{ marginTop: "1ch" }} size="large" type="primary" icon={<LinkOutlined />} onClick={() => {
                                                                    navigator.clipboard.readText().then(text => {
                                                                        if (!(/^.*\/Team\/Join\/[0-9a-fA-F]{32}$/.test(text))) message.error("Invalid link. Please check that you have copied the link correctly.", 3)
                                                                        else {
                                                                            const code = text.split("/Team/Join/")
                                                                            this.getCodeDetails(code[1])
                                                                        }

                                                                    }).catch(err => {
                                                                        console.log(err)
                                                                        message.error("Failed to read link from your clipboard.", 5)
                                                                        message.info("Please ensure that you have allowed permissions for reading of clipboard text.", 5)
                                                                    })

                                                                }}>Paste &amp; Use Link</Button>
                                                            </div>
                                                        </div>
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
