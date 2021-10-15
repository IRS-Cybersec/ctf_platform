import React from 'react';
import { Layout, message, Empty, Divider, Avatar, Table } from 'antd';
import { AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid, Label, ResponsiveContainer } from "recharts";
import { Ellipsis } from 'react-spinners-css';
import orderBy from 'lodash.orderby'
import {
    FileUnknownTwoTone,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Column } = Table;


class Teams extends React.Component {

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
            </Layout>
        )
    }
}




export default Teams;
