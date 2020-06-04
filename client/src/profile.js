import React from 'react';
import { Layout, Menu, Breadcrumb, Typography, Empty, Divider, Avatar } from 'antd';
import {PieChart, Pie, Cell, Tooltip} from 'recharts';
import './App.css';
import { NavLink, Switch, Route, withRouter, useHistory, useLocation } from 'react-router-dom';


const { Header, Content, Footer, Sider } = Layout;
const { Title, Paragraph, Text } = Typography;
class Profile extends React.Component {
    

    constructor(props) {
        super(props);

        this.state = {
            targetUser: this.props.username,
            score: 350,
            solved: [
                {
                  type: 'pwn',
                  value: 100,
                },
                {
                  type: 'web',
                  value: 200,
                },
                {
                  type: 'forensics',
                  value: 50,
                },
                {
                  type: 'crypto',
                  value: 50,
                },
              ]
        };


        var path = window.location.pathname.split("/");
        console.log(path.length);
        if (path.length == 3) {
            this.state.targetUser = path[2];
            if (this.state.targetUser != "")
                //Just a temp check. Replace with a db call of some kind.
                if (this.state.targetUser != "Tkaixiang") {
                    this.state.targetUser = null;
                }
        }
    }

    render() {
        //Empty page. No user found
        if (this.state.targetUser == null) {
            return (
                <Layout style={{ height: "100%", width: "100%" }}>
                    <br /><br /><br />
                    <Empty>That user doesn't exist</Empty>
                </Layout>
            );
        }

        //User found, show general details.
        var header = (
            <div style={{display: "flex", justifyContent: "row", alignContent: "center", alignItems: "center", float: "right"}}>
                <Avatar style={{backgroundColor:"Red",marginRight: "3%"}} size={100} src="https://www.todayifoundout.com/wp-content/uploads/2017/11/rick-astley.png"/>
                <Title>{this.state.targetUser}</Title>
            </div>
        );

        const RADIAN = Math.PI / 180;  
        const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius,value,type }) => {
            const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
         const x  = cx + radius * Math.cos(-midAngle * RADIAN);
         const y = cy  + radius * Math.sin(-midAngle * RADIAN);
            var tag = "";
            if(value > 0){
                tag = type;
            }
         return (
           <text style={{fontWeight: "bolder"}}x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} 	dominantBaseline="central">
               {tag}
           </text>
         );
       };

        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

        var chart = (
            <div style={{width: "40%",height:"40%", marginRight:"3%",marginBottom:"3%"}}>
                <div style={{display: "flex",alignContent: "center", alignItems: "center"}}>
                    
                    <PieChart width={800} height={350} onMouseEnter={this.onPieEnter}>
                        <Pie
                        data={this.state.solved}
                        cx={250}
                        cy={150}
                        outerRadius={100}
                        fill="#8884d8"
                        label={renderCustomizedLabel}
                        labelLine={false}
                        paddingAngle={0}
                        dataKey="value"
                        >
                        {
                            this.state.solved.map((entry, index) => 
                            <Cell key={`${index}`} fill={COLORS[index % COLORS.length]} 
                            />)
                        }
                        </Pie>
                    </PieChart>
                </div>
                <Divider plain />
            </div>
        );

        var score = (
            <div style={{width: "40%",height:"40%", marginRight:"3%",marginBottom:"3%"}}>
                <div style={{display: "flex",alignContent: "center", alignItems: "center"}}>
                    <Title style={{marginRight:"1vw",fontSize:"3vw",textAlign:"center"}}>{this.state.score+"⌖"}</Title>
                    <div style={{width:800,height:350}}></div>
                </div>
                <Divider plain />
            </div>
        );

        //If the user is the same as your account, show more info.

        return (
            <Layout style={{ height: "100%", width: "100%", padding: "3%" }}>
                {header}
                <Divider plain />
                <div style={{display: "flex",justifyContent: "row"}}>
                    {score}
                    {chart}
                </div>
            </Layout>
        );
    }
}


export default Profile;
