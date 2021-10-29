import React from 'react';
import { Layout, message, Empty, Divider, Avatar, Table } from 'antd';
import { AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid, Label, ResponsiveContainer } from "recharts";
import { Ellipsis } from 'react-spinners-css';
import orderBy from 'lodash.orderby'
import {
    FileUnknownTwoTone,
    FrownOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Column } = Table;


class Profile extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            score: 0,
            challenges: [],
            targetUser: "",
            loading: true,
            userScore: "Loading...",
            graphData: [],
        }
    }

    componentDidMount() {
        const username = this.props.match.params.user;
        if (typeof username !== "undefined") {
            this.setState({ targetUser: username })
            this.unpackChallengesData(username);
        }
        else {
            this.setState({ targetUser: this.props.username })
            this.unpackChallengesData(this.props.username);
        }

    }

    //Marvel in glory at the hideous mess of tangled backend handling.
    //Gawk at the terrible use of index-based for loops when streams exist now
    //Try, and fail, to interpret the sheer rubbish that is this method.
    //But it works. And that is enough for me to bury it forever.
    //- Leonard.
    //- Tkai: Archived since 2020
    unpackChallengesData = async (username) => {
        fetch(window.ipAddress + "/v1/scoreboard/" + username, {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {

                if (data.hidden !== true) {
                    let challengeDS = []
                    let challengeArray = orderBy(data.scores, ["timestamp"], ["desc"])
                    let challengeArrayReversed = orderBy(data.scores, ["timestamp"], ["asc"])
                    let graphData = []
                    let graphPoint = {}
                    let scoreTotal = 0

                    graphData.push({
                        Score: 0,
                        Time: "0"
                    })

                    for (let x = 0; x < challengeArray.length; x++) {
                        if (challengeArrayReversed[x].points !== 0) {
                            //Plot graph
                            scoreTotal += challengeArrayReversed[x].points
                            graphPoint = {
                                Score: scoreTotal,
                                Time: new Date(challengeArrayReversed[x].timestamp).toLocaleString("en-US", { timeZone: "Asia/Singapore" })
                            }
                            graphData.push(graphPoint)
                        }

                        if (challengeArray[x].points !== 0) {
                            //Handle table
                            let currentDS = {
                                key: String(x),
                                challenge: "",
                                score: "",
                                time: "",
                                challengeID: ""
                            }
                            const currentStuff = challengeArray[x]
                            //Current record is a hint
                            if (currentStuff.type === "hint") currentDS.challenge = "Purchased Hint For: " + currentStuff.challenge
                            else currentDS.challenge = currentStuff.challenge
                            if ("challengeID" in currentStuff) currentDS.challengeID = currentStuff.challengeID
                            currentDS.score = currentStuff.points
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
                    this.setState({ userScore: scoreTotal, graphData: graphData, scores: challengeDS })
                    //console.log(graphData)
                }
                else this.setState({ userScore: "Hidden" })

            }
            else {
                if (data.error === "not-found") {
                    message.error("The user '" + username + "' was not found")
                    console.error(data.error)
                }
                else {
                    message.error("Something went wrong looking up " + username)
                    console.error(data.error)
                }
                this.setState({ targetUser: "", userScore: 0 })

            }
        }).catch((error) => {
            console.log(error);
            message.error({ content: "Something went wrong fetching your challenges." })
        })
        this.setState({ loading: false })
    }

    render() {
        return (
            <Layout className="layout-style">


                {this.state.loading && (
                    <div style={{ position: "absolute", left: "55%", transform: "translate(-55%, 0%)", zIndex: 10 }}>
                        <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                    </div>
                )}
                {
                    !this.state.targetUser && !this.state.loading && (
                        <div style={{ height: "100%", width: "100%" }}>
                            <br /><br /><br />
                            <Empty
                                image={<FrownOutlined />}
                                imageStyle={{ fontSize: "500%", color: "#177ddc" }}
                                description={<h1>We were unable to find the user "{this.props.match.params.user}"</h1>}
                            />
                        </div>
                    )
                }
                {
                    this.state.targetUser && !this.state.loading && (
                        <Layout style={{ height: "100%", width: "100%", padding: "3%", backgroundColor: "rgba(0, 0, 0, 0)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex" }}>
                                    <div style={{ display: "flex", marginRight: "5ch", alignItems: "center", justifyItems: "center" }}>
                                        <Avatar style={{ backgroundColor: "transparent", marginRight: "3ch", width: "10ch", height: "10ch" }} size='large' src={"/static/profile/" + this.state.targetUser + ".webp"} />
                                        <h1 style={{ fontSize: "5ch" }}>{this.state.targetUser}</h1>
                                    </div>
                                    <div>
                                        <h1 style={{ fontSize: "5ch", color: "#faad14" }}><span style={{ color: "#d48806", fontSize: "1.5ch" }}><u>Score:</u> </span>{this.state.userScore}</h1>
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
                            <Table style={{ marginTop: "2vh" }} dataSource={this.state.scores} pagination={{ pageSize: 10 }} locale={{
                                emptyText: (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                        <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                        <h1 style={{ fontSize: "200%" }}>{this.state.targetUser} has not completed any challenges/bought any hints</h1>
                                    </div>
                                )
                            }}>
                                <Column width={1} title="Challenge/Hint" dataIndex="challenge" key="challenge"
                                    render={(text, row, index) => {
                                        if (row.challengeID !== "") return <Link to={"/Challenges/" + row.challengeID}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                                        else return (<span>{text}</span>);
                                    }} />
                                <Column width={30} title="Score Change" dataIndex="score" key="score" />
                                <Column width={30} title="Solved Timestamp" dataIndex="time" key="time" />
                            </Table>
                        </Layout>

                    )
                }
            </Layout>
        )
    }
}




export default Profile;
