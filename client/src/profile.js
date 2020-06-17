import React from 'react';
import { Layout, message, Typography, Empty, Divider, Avatar } from 'antd';
import {PieChart, Pie, Cell} from 'recharts';
import './App.css';


const { Title, Paragraph, Text } = Typography;
class Profile extends React.Component {
    
    //Marvel in glory at the hideous mess of tangled backend handling.
    //Gawk at the terrible use of index-based for loops when streams exist now
    //Try, and fail, to interpret the sheer rubbish that is this method.
    //But it works. And that is enough for me to bury it forever.
    //- Leonard.
    unpackChallengesData(){
        fetch("https://api.irscybersec.tk/v1/challenge/list", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
          }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
          }).then((data) => {
            if (data.success === true) {
                data = data.data;
                var categorySolves = [];
                var score = 0;
                for(var i = 0; i < data.length; i++){
                    var catData = data[i];
                    var categoryID = catData._id;
                    var toAdd = true;
                    
                    //console.log("Looping through " + categoryID + " with chall length " + catData.challenges.length);
                    for(var z = 0; z < categorySolves.length; z++){
                        var entry = categorySolves[z];
                        if(entry.type == categoryID){
                            toAdd = false;
                            break;
                        }
                    }
                    if(toAdd){
                        categorySolves.push({type:categoryID,value:0});
                    }
                    for(var j = 0; j < catData.challenges.length; j++){
                        var challenge = catData.challenges[j];
                        if(challenge.solved){
                            for(var z = 0; z < categorySolves.length; z++){
                                var entry = categorySolves[z];
                                if(entry.type == categoryID){
                                    entry.value += challenge.points;
                                    score += challenge.points;
                                }
                            }
                        }
                    }
                }
            
                this.setState({
                    solved: categorySolves,
                    score: score,
                    targetUser: this.props.username
                });
            } else { //Guess we'll die.
              message.error({content: "Something went wrong fetching your challenges."})
            }
          }).catch((error) => {
            console.log(error);
            message.error({content: "Something went wrong fetching your challenges."})
          })
    }

    constructor(props) {
        super(props);
        console.log(this.props);
        this.state = {
            solved: [],
            score: 0,
            targetUser: this.props.username,
            width: 0,
            height: 0,
        }
        this.updateWindowDimensions.bind(this);
    }

    componentDidMount(){
       // console.log("Lolmao");
        const startup = async () => {
            await this.unpackChallengesData();
            var path = window.location.pathname.split("/");
            console.log(path);
            if (path.length == 3) {
                this.state.targetUser = path[2];
                if (this.state.targetUser != "")
                    //Just a temp check. Replace with a db call of some kind.
                    if (this.state.targetUser != "Tkaixiang") {
                        this.state.targetUser = null;
                    }
            }
         };
        startup();
        
        this.updateWindowDimensions();
    }


    render() {
        console.log(this.state);
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
                <Avatar style={{backgroundColor:"Red",marginRight: "3%"}} size={0.149*this.state.height} src="https://www.todayifoundout.com/wp-content/uploads/2017/11/rick-astley.png"/>
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
           <text style={{fontSize: "1.5vw", fontWeight: "bolder"}}x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} 	dominantBaseline="central">
               {tag}
           </text>
         );
       };

        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


        var format =  {
            core: {display: "flex",justifyContent: "row"},
            indivwidth: "45%",
            chartHeight: 0.450*this.state.height,
            scoreHeight: 0.450*this.state.height
        };
        
        if(this.state.width < 700){
            format.core = {}; //If screen is too narrow, don't display side by side
            format.indivwidth = "100%";
            format.scoreHeight = 0.200*this.state.height;
        }

        //width: 1235, height: 681
        var chart = (
            <div style={{marginRight:"3%",marginBottom:"3%",width: format.indivwidth}}>
                <div style={{width:"100%",height:format.chartHeight,display: "flex",alignContent: "center", alignItems: "center"}}>
                    <PieChart width={0.666*this.state.width} height={0.414*this.state.height} onMouseEnter={this.onPieEnter}>
                        <Pie
                        data={this.state.solved}
                        cx={0.170*this.state.width}
                        cy={0.220*this.state.height}
                        outerRadius={0.14*this.state.height}
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
            <div style={{marginRight:"3%",marginBottom:"3%",width: format.indivwidth}}>
                <div style={{width:"100%",height:format.scoreHeight,textAlign:"center",}}>
                    <Title style={{width:"100%",paddingTop:format.scoreHeight/2.5,fontSize: 0.1*this.state.height}}>{this.state.score+"⌖"}</Title>
                    <div style={{width:0.666*this.state.width,height:"100%"}}></div>
                </div>
                <Divider plain />
            </div>
        );

        return (
            <Layout style={{ height: "100%", width: "100%", padding: "3%" }}>
                {header}
                <Divider plain />
                <div style={format.core}>
                    {score}
                    {chart}
                </div>
            </Layout>
        );
    }

    updateWindowDimensions() {
        this.setState({ width: window.innerWidth, height: window.innerHeight });
      }
}




export default Profile;
