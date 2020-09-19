import React from 'react';
import { Layout, Card, List, Progress, message, Button, Radio, Select } from 'antd';
import {
  FileUnknownTwoTone,
  LeftCircleTwoTone,
  AppstoreOutlined,
  GroupOutlined
} from '@ant-design/icons';
import './App.css';
import { Link } from 'react-router-dom';
import ChallengesCategory from "./challengesCategory.js";
import ChallengesTagSort from "./challengesTagSort.js";
import { Ellipsis } from 'react-spinners-css';
import { Transition, animated } from 'react-spring/renderprops';

const { Meta } = Card;
const { Option } = Select;

const categoryImages = [require("./assets/catPhoto1.jpg"), require("./assets/catPhoto2.jpg"), require("./assets/catPhoto3.jpg")]



var i = -1

class Challenges extends React.Component {
  constructor(props) {
    super(props);
    this.child = React.createRef();

    this.state = {
      categories: [],
      challengeCategory: false,
      currentCategory: "",
      userScore: 0,
      originalData: [],
      tagData: [],
      sortByTags: false,
      loadingChall: false,
      RadioValue: "Category",
      currentCategoryChallenges: []
    };
  }

  componentDidMount() {
    this.setState({ loadingChall: true })

    this.fetchCategories()
    this.obtainScore()
  }

  obtainScore() {
    fetch("https://api.irscybersec.tk/v1/scores/" + localStorage.getItem("IRSCTF-token").split(".")[0], {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      //console.log(data)

      if (data.success === true) {
        this.setState({ userScore: data.score })
      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  parseCategories(data) {
    for (let x = 0; x < data.length; x++) {
      let currentCategory = data[x].challenges
      let solvedStats = {
        challenges: currentCategory.length,
        solved: 0,
        percentage: 0
      }

      for (let y = 0; y < currentCategory.length; y++) {
        if (currentCategory[y].solved === true) {
          solvedStats.solved += 1
        }
      }

      solvedStats.percentage = Math.round((solvedStats.solved / solvedStats.challenges) * 100)
      data[x].challenges = solvedStats
    }

    return data;

  }

  fetchCategories() {
    fetch("https://api.irscybersec.tk/v1/challenge/list", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      console.log(data)

      if (data.success === true) {

        const parseData = async () => {
          let originalData = JSON.parse(JSON.stringify(data.challenges))
          const newData = await this.parseCategories(data.challenges)

          //convert array to dict

          let originalDataDictionary = {}
          for (let i = 0; i < originalData.length; i++) {
            originalDataDictionary[originalData[i]._id] = originalData[i].challenges
          }

          await this.setState({ categories: newData, originalData: originalDataDictionary, loadingChall: false })


          const category = this.props.match.params.category;
          if (typeof category !== "undefined") {
            this.setState({ challengeCategory: true, currentCategory: decodeURIComponent(category), currentCategoryChallenges: this.state.originalData[decodeURIComponent(category)] })
          }
        }
        parseData()
      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  sortCats(value) {
    this.child.current.sortCats(value)
  }

  sortDifferent(value) {
    this.setState({ RadioValue: value.target.value })
    if (value.target.value === "Type" && !this.state.sortByTags) {
      if (this.state.currentCategory) { //currentCategory is whether a category has been set, challengeCategory is for the visibility of the component
        let originalData = this.state.originalData
        //Since the category is not the key, we will need to loop through the list to find the category
        this.setState({ tagData: [originalData[this.state.currentCategory]], sortByTags: true, challengeCategory: false })

      }
      else {
        this.setState({ sortByTags: true, tagData: this.state.originalData })
      }

    }
    else if (this.state.sortByTags && value.target.value === "Category") {

      if (this.state.currentCategory) {
        this.setState({ sortByTags: false, challengeCategory: true })
      }
      else {
        this.setState({ sortByTags: false })
      }

    }
  }

  render() {
    return (

      <animated.div style={{ ...this.props.transition, position: "fixed", overflowX: "hidden", height: "100%"}}>
        <Layout style={{ width: "100%", paddingRight: "10px"}}>
          <div id="Header" style={{ positon: "relative", width: "100%", height: "40vh", textAlign: "center", borderStyle: "solid", borderWidth: "0px 0px 3px 0px", borderColor: "#1890ff", lineHeight: "1.1", marginBottom: "1.5vh" }}>
            <img alt="Banner" style={{ width: "100%", height: "100%", opacity: 0.6 }} src={require("./assets/challenges_bg.jpg")} />

            {!this.state.currentCategory && (
              <h1 style={{
                color: "white", 
                position: "relative",
                bottom: "60%",
                fontSize: "250%",
                letterSpacing: ".3rem",
                backgroundColor: "#164c7e",
                paddingTop: "10px",
                paddingBottom: "10px",
                fontWeight: 300
              }}> CHALLENGES
              </h1>
            )}

            {this.state.currentCategory && (
              <h1 style={{
                color: "white",
                position: "relative",
                bottom: "70%",
                fontSize: "140%",
                letterSpacing: ".3rem",
                backgroundColor: "#164c7e",
                paddingTop: "10px",
                fontWeight: 300
              }}> CHALLENGES <p style={{ fontSize: "210%", letterSpacing: "normal", paddingBottom: "10px", fontWeight: 400 }}>{this.state.currentCategory}</p></h1>

            )}
            {this.state.currentCategory && (
              <Button type="primary" style={{ display: "block", position: "relative", bottom: "75%", left: "1%" }} icon={<LeftCircleTwoTone twoToneColor="#d89614" />} onClick={() => { this.props.history.push("/Challenges"); this.setState({ challengeCategory: false, currentCategory: "", sortByTags: false, RadioValue: "Category" }) }} size="large">Back</Button>
            )}

          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignContent: "center", marginBottom: "3vh" }}>
            <h1 style={{ fontSize: "120%", padding: "5px", borderRadius: "5px", borderStyle: "solid", borderWidth: "1px", borderColor: "#177ddc", color: "#d89614", backgroundColor: "#1f1f1f", fontWeight: 600 }}>Current Score: <u>{this.state.userScore}</u></h1>
            <div>
              {this.state.currentCategory && !this.state.sortByTags && (
                <Select defaultValue="points" style={{ marginRight: "1.5vw", width: "10vw" }} onChange={this.sortCats.bind(this)}>
                  <Option value="points">Sort by Points</Option>
                  <Option value="abc">Sort A→Z</Option>
                  <Option value="abcrev">Sort Z→A</Option>
                </Select>
              )}
              <Radio.Group buttonStyle="solid" size="large" onChange={this.sortDifferent.bind(this)} value={this.state.RadioValue}>
                <Radio.Button value="Category">Category <AppstoreOutlined /> </Radio.Button>
                <Radio.Button value="Type">Type <GroupOutlined /> </Radio.Button>
              </Radio.Group>

            </div>
          </div>


          <div style={{ position: "relative" }}>
            <Transition
              items={this.state.loadingChall}
              from={{ opacity: 0 }}
              enter={{ opacity: 1 }}
              leave={{ opacity: 0 }}>
              {toggle => (
                props => {
                  if (toggle === true) {
                    return (<div style={{ ...props, position: "absolute", left: "50%", transform: "translate(-50%, 0%)", zIndex: 10 }}>
                      <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                    </div>)
                  }
                  else {
                    return (<div style={{ ...props }}>
                      {!this.state.challengeCategory && !this.state.sortByTags && (
                        <List
                          grid={{ column: 4, gutter: 20 }}
                          dataSource={this.state.categories}
                          locale={{
                            emptyText: (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                <h1 style={{ fontSize: "200%" }}>Oops, no challenges have been created.</h1>
                              </div>
                            )
                          }}
                          renderItem={item => {
                            i = 0

                            return (
                              <List.Item key={item._id}>
                                <Link to={"/Challenges/" + item._id}>
                                  <div onClick={() => { this.setState({ challengeCategory: true, currentCategory: item._id, currentSolvedStatus: item.challenges, currentCategoryChallenges: this.state.originalData[item._id] }) }}>
                                    <Card
                                      hoverable
                                      type="inner"
                                      bordered={true}
                                      bodyStyle={{ backgroundColor: "#262626" }}
                                      className="card-design"
                                      style={{ overflow: "hidden" }}
                                      cover={<img style={{ height: "20vh", width: "30vw", overflow: "hidden" }} alt="Category Card" src={categoryImages[i]} />}
                                    >
                                      <Meta
                                        title={
                                          <div id="Title" style={{ display: "flex", color: "#f5f5f5", flexDirection: "row", alignContent: "center", alignItems: "center" }}>
                                            <h1 style={{ color: "white", fontSize: "100%", width: "15vw", textOverflow: "ellipsis", overflow: "hidden" }}>{item._id}</h1>
                                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                                              <h2 style={{ fontSize: "1vw", marginLeft: "1vw" }}>{item.challenges.solved}/{item.challenges.challenges}</h2>
                                              <Progress type="circle" percent={item.challenges.percentage} width="3.2vw" strokeColor={{
                                                '0%': '#177ddc',
                                                '100%': '#49aa19',
                                              }} style={{ marginLeft: "1vw", fontSize: "1vw" }} />
                                            </div>
                                          </div>
                                        }
                                      />
                                    </Card> {/*Pass entire datasource as prop*/}
                                  </div>
                                </Link>
                              </ List.Item>
                            )
                          }
                          }
                        />
                      )}

                      {this.state.challengeCategory && (
                        <ChallengesCategory ref={this.child} currentCategoryChallenges={this.state.currentCategoryChallenges} category={this.state.currentCategory} challengeFetchCategory={this.fetchCategories.bind(this)}></ChallengesCategory>
                      )}

                      {this.state.sortByTags && (
                        <ChallengesTagSort tagData={this.state.tagData}></ChallengesTagSort>
                      )}
                    </div>)
                  }


                }
              )
              }
            </Transition>
          </div>
        </Layout>
      </animated.div>

    );
  }
}

export default Challenges;
