import React from 'react';
import { Layout, Menu, Breadcrumb, Typography, Empty, Divider, Avatar } from 'antd';
import {
    FlagTwoTone,
    HomeTwoTone,
    FundTwoTone,
    NotificationTwoTone,
    SmileTwoTone,
    AimOutlined
} from '@ant-design/icons';
import './App.css';
import { NavLink, Switch, Route, withRouter, useHistory, useLocation } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;
const { Title, Paragraph, Text } = Typography;

class Profile extends React.Component {

    constructor(props) {
        super(props);
        /*      fetch('https://api.irscybersec.tk/v1/account/list', {
                    method: 'get',
                    headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
        
                    if (data.success === true) {
                        const retrievedData = data.explore.questions
                        const currentData = this.state.explorePostsData
                        this.setState({ explorePostsData: currentData.concat(retrievedData) }) //Concat newly retrieved data
                        this.setState({ loading: false, }) //Done loading, set loading state to false
        
                        console.log(data.explore.questions)
                    }
                }).catch((error) => {
                   console.log(error);
                })  */

        this.state = {
            username: "Tkaixiang",
            email: "tkaixiang@gmail.com",
            type: 1,
            score: 1999
        };

        var targetUser = this.state.username;

        var path = window.location.pathname.split("/");
        console.log(path.length);
        if (path.length == 3) {
            targetUser = path[2];
            if (targetUser != "")
                //Just a temp check. Replace with a db call of some kind.
                if (targetUser != "Tkaixiang") {
                    this.state.username = null;
                }
        }
    }

    render() {
        //Empty page. No user found
        if (this.state.username == null) {
            return (
                <Layout style={{ height: "100%", width: "100%" }}>
                    <br /><br /><br />
                    <Empty>That user doesn't exist</Empty>
                </Layout>
            );
        }

        var header = (
            <div style={{display: "flex", justifyContent: "row", alignContent: "center", alignItems: "center", float: "right"}}>
                <Avatar style={{backgroundColor:"Red",marginRight: "3%"}} size={100} src="https://www.todayifoundout.com/wp-content/uploads/2017/11/rick-astley.png"/>
                <Title style={{backgroundColor:"blue"}}>{this.props.username}</Title>
            </div>
        );

        var score = (
            <div style={{width: "40%",height:"40%", marginRight:"3%",marginBottom:"3%"}}>
                <div style={{display: "flex",alignContent: "center", alignItems: "center"}}>
                    <Title style={{marginRight:"1vw",fontSize:"3vw"}}>{this.state.score}</Title>
                    <AimOutlined style={{fontSize:"3vw"}}/>
                </div>
                <Divider plain />
            </div>
        );
        return (
            <Layout style={{ height: "100%", width: "100%", padding: "3%" }}>
                {header}
                <Divider plain />
                <div style={{display: "flex",justifyContent: "row"}}>
                    {score}
                    {score}
                </div>
            </Layout>
        );
    }
}

export default Profile;
