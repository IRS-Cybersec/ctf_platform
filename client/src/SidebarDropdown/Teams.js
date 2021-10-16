import React from 'react';
import { Layout, message, Empty, Divider, Avatar, Table, Modal } from 'antd';
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
            isInvite: false,
            inviteName: "",
            loading: true
        }
    }

    componentDidMount() {
        const code = this.props.match.params.code
        if (typeof code !== "undefined") {
            this.getCodeDetails(code)
        }
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
                this.setState({ isInvite: true, inviteName: data.name })
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
                    okText="Join Team"
                    title="Team Invite Link"
                    visible={this.state.isInvite}
                >
                    <h1>Do you want to join {this.state.inviteName}?</h1>
                </Modal>

                {this.state.loading ? (
                    <div style={{ position: "absolute", left: "55%", transform: "translate(-55%, 0%)", zIndex: 10 }}>
                        <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                    </div>
                ) : (
                    <div>
                        {this.props.team ?
                            (
                                <div>
                                </div>
                            ) :
                            (
                                <div>
                                </div>
                            )
                        }
                    </div>
                )}

            </Layout>
        )
    }
}




export default Teams;
