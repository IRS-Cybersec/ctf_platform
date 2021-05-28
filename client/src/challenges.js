import React from 'react';
import { Layout, Card, List, Progress, message, Button, Radio, Select } from 'antd';
import {
  FileUnknownTwoTone,
  LeftCircleOutlined,
  AppstoreOutlined,
  TagsOutlined
} from '@ant-design/icons';
import './App.min.css';
import { Link } from 'react-router-dom';
import ChallengesCategory from "./challengesCategory.js";
import ChallengesTagSort from "./challengesTagSort.js";
import { Ellipsis } from 'react-spinners-css';
import { Transition, animated } from 'react-spring';

const { Meta } = Card;
const { Option } = Select;

const categoryImages = [require("./assets/catPhoto1.webp").default]



var i = -1

class Challenges extends React.Component {
  constructor(props) {
    super(props);
    this.child = React.createRef();
    this.tagSortRef = React.createRef();

    this.state = {
      categories: [],
      challengeCategory: false,
      currentCategory: false,
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

  fetchCategories = async () => {
    await fetch(window.ipAddress + "/v1/challenge/list", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then(async (data) => {
      if (data.success === true) {

        let originalData = JSON.parse(JSON.stringify(data.challenges))
        const newData = await this.parseCategories(data.challenges) //this statement changes the object data

        //convert array to dict

        let originalDataDictionary = {}
        for (let i = 0; i < originalData.length; i++) {
          originalDataDictionary[originalData[i]._id] = originalData[i].challenges
        }

        await this.setState({ categories: newData, originalData: originalDataDictionary, loadingChall: false })

        const category = this.props.match.params.category;
        if (typeof category !== "undefined") {
          await this.setState({ currentCategory: decodeURIComponent(category), currentCategoryChallenges: this.state.originalData[decodeURIComponent(category)] })
          this.sortDifferent({ target: { value: "Type" } })
        }


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

    if (this.state.sortByTags) this.tagSortRef.current.sortCats(value)
    else this.child.current.sortCats(value)
    
  }

  sortDifferent(value) {
    this.setState({ RadioValue: value.target.value })
    if (value.target.value === "Type") {

      if (this.state.currentCategory) { //currentCategory is whether a category has been set, challengeCategory is for the visibility of the component
        let originalData = this.state.originalData
        //Since the category is not the key, we will need to loop through the list to find the category
        this.setState({ tagData: [originalData[this.state.currentCategory]], sortByTags: true, challengeCategory: false })

      }
      else {
        this.setState({ sortByTags: true, tagData: this.state.originalData })
      }

    }
    else if (value.target.value === "Category") {

      if (this.state.currentCategory) {
        this.setState({ sortByTags: false, challengeCategory: true })
      }
      else {
        this.setState({ sortByTags: false })
      }

    }
  }

  handleRefresh = async (tagSorting) => {

    await this.fetchCategories()
    if (!tagSorting) {
      await this.sortDifferent({ target: { value: "Category" } })
      await this.setState({ currentCategoryChallenges: this.state.originalData[this.state.currentCategory]})
    }

    await this.props.obtainScore()
  }

  render() {
    return (
        <Layout style={{ minHeight: "95vh", margin: "20px", backgroundColor: "rgba(0, 0, 0, 0)" }}>
          <div id="Header" style={{ positon: "relative", width: "100%", height: "40vh", textAlign: "center", borderStyle: "solid", borderWidth: "0px 0px 3px 0px", borderColor: "#1890ff", lineHeight: "1.1", marginBottom: "1.5vh", backgroundColor: "rgba(0, 0, 0, 1)" }}>
            <img alt="Banner" style={{ width: "100%", height: "100%", opacity: 0.6 }} src={require("./assets/challenges_bg.webp").default} />

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


          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignContent: "center", marginBottom: "3vh" }}>

            <Button size="large" disabled={!this.state.currentCategory} icon={<LeftCircleOutlined />} style={{ backgroundColor: "#1f1f1f" }} onClick={() => { this.props.history.push("/Challenges"); this.setState({ challengeCategory: false, currentCategory: false, sortByTags: false, RadioValue: "Category" }) }} size="large">Back</Button>
            <div>
              <Select disabled={!this.state.currentCategory && !this.state.sortByTags} defaultValue="points" style={{ marginRight: "1.5vw", width: "20ch", backgroundColor: "#1f1f1f" }} onChange={this.sortCats.bind(this)}>
                <Option value="points">Sort by ↑Points</Option>
                <Option value="pointsrev">Sort by ↓Points</Option>
                <Option value="abc">Sort A→Z</Option>
                <Option value="abcrev">Sort Z→A</Option>
              </Select>
              <Radio.Group buttonStyle="solid" size="large" onChange={this.sortDifferent.bind(this)} value={this.state.RadioValue} style={{ backgroundColor: "#1f1f1f" }}>
                <Radio.Button value="Category">Sort By Category <AppstoreOutlined /> </Radio.Button>
                <Radio.Button value="Type">Sort By Tag <TagsOutlined /> </Radio.Button>
              </Radio.Group>

            </div>
          </div>


          <div>
            <Transition
              items={this.state.loadingChall}
              from={{ opacity: 0 }}
              enter={{ opacity: 1 }}
              leave={{ opacity: 0 }}>
              {(props,toggle) => {
                  if (toggle === true) {
                    return (<animated.div style={{ ...props, position: "absolute", left: "55%",transform: "translate(-55%, 0%)", zIndex: 10 }}>
                      <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                    </animated.div>)
                  }
                  else {
                    return (<animated.div style={{ ...props }}>
                      {!this.state.challengeCategory && !this.state.sortByTags && (
                        <List
                          grid={{
                            xs: 1,
                            sm: 1,
                            md: 2,
                            lg: 3,
                            xl: 3,
                            xxl: 4,
                            gutter: 20
                          }}
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
                                  <div onClick={async () => {
                                    await this.setState({ currentCategory: item._id, currentSolvedStatus: item.challenges, currentCategoryChallenges: this.state.originalData[item._id] });
                                    this.sortDifferent({ target: { value: "Type" } })
                                  }}>
                                    <Card
                                      hoverable
                                      type="inner"
                                      bordered={true}
                                      bodyStyle={{ backgroundColor: "#262626" }}
                                      className="card-design"
                                      style={{ overflow: "hidden" }}
                                      cover={<img style={{ height: "35ch", width: "55ch", overflow: "hidden" }} alt="Category Card" src={categoryImages[i]} />}
                                    >
                                      <Meta
                                        title={
                                          <div id="Title" style={{ display: "flex", color: "#f5f5f5", flexDirection: "row", alignContent: "center", alignItems: "center" }}>
                                            <h1 style={{ color: "white", fontSize: "2.5ch", width: "40ch", textOverflow: "ellipsis", overflow: "hidden" }}>{item._id}</h1>
                                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                                              <h2 style={{ fontSize: "2.5ch", marginLeft: "1vw", color: "#faad14", fontWeight: 700 }}>{item.challenges.solved}/{item.challenges.challenges}</h2>
                                              <Progress type="circle" percent={item.challenges.percentage} width="7ch" strokeColor={{
                                                '0%': '#177ddc',
                                                '100%': '#49aa19',
                                              }} style={{ marginLeft: "1vw", fontSize: "2ch" }} />
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
                        <ChallengesCategory match={this.props.match} history={this.props.history} handleRefresh={this.handleRefresh.bind(this)} ref={this.child} currentCategoryChallenges={this.state.currentCategoryChallenges} category={this.state.currentCategory}></ChallengesCategory>
                      )}

                      {this.state.sortByTags && (
                        <ChallengesTagSort match={this.props.match} history={this.props.history} tagData={this.state.tagData} handleRefresh={this.handleRefresh.bind(this)} ref={this.tagSortRef} category={this.state.currentCategory} currentCategoryChallenges={this.state.currentCategoryChallenges}></ChallengesTagSort>
                      )}
                    </animated.div>)
                  }
                }
              }
            </Transition>
          </div>
        </Layout>

    );
  }
}

export default Challenges;
