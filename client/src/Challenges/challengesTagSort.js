import React, { Suspense } from 'react';
import { Layout, List, message, Modal, Tag, Input, Button, Tabs, Avatar, Form, notification, Tooltip, Card, Divider } from 'antd';
import {
  UnlockOutlined,
  ProfileOutlined,
  FlagOutlined,
  SmileOutlined,
  ExclamationCircleOutlined,
  SolutionOutlined,
  LinkOutlined,
  FileUnknownTwoTone,
  LoadingOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  CheckOutlined
} from '@ant-design/icons';
const MarkdownRender = React.lazy(() => import('./../Misc/MarkdownRenderer.js'));
import { Link } from 'react-router-dom';
import ChallengesTagSortList from './challengesTagSortList.js';
import orderBy from 'lodash.orderby';
import { Ellipsis } from 'react-spinners-css';

const { TabPane } = Tabs;
const { confirm } = Modal;
const { CheckableTag } = Tag;
const { Meta } = Card;

const SubmitFlagForm = (props) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      name="submit-flag"
      className="submit-flag-form"
      onFinish={(values) => { props.submitFlag(values); form.resetFields() }}
      style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "2vh" }}
    >
      <Form.Item
        name="flag"
        rules={[{ required: true, message: 'Hint: Flags are not blank.' }]}>
        <Input disabled={props.currentChallengeSolved} style={{ width: "45ch" }} placeholder={props.currentChallengeStatus} />
      </Form.Item>
      <Form.Item>
        <Button disabled={props.currentChallengeSolved} type="primary" htmlType="submit" icon={<FlagOutlined />}>Submit</Button>
      </Form.Item>
    </Form>
  );
}


class ChallengesTagSort extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      challenges: [],
      challengeModal: false,
      currentChallenge: "",
      currentChallengeStatus: "",
      viewingChallengeDetails: {
        name: "",
        category: this.props.category,
        description: "",
        points: 0,
        author: "",
        created: "",
        solves: [],
        max_attempts: 0,
        tags: [],
        hints: [],
      },
      challengeTags: [],
      loadingChallenge: false,
      currentChallengeSolved: false,
      challengeHints: [],
      attemptsLeft: "",
      hintContent: "",
      hintModal: false,
      currentSorting: "points",
      tag: false,
      loadingTag: false,
      challengeWriteup: "",
      sortType: "points",
      selectedTags: []
    };
  }

  componentDidMount() {

    if (this.props.foundChallenge !== false) {
      this.sortByTags(this.props.foundChallenge._id)
      this.loadChallengeDetails(this.props.foundChallenge._id, this.props.foundChallenge.solved)
      this.props.history.push("/Challenges/" + this.props.foundChallenge._id)
    }
    else this.sortByTags()

  }

  sortCats(sortType, force = false) {
    if (sortType !== this.state.sortType || force) {

      if (this.state.selectedTags.length > 0) {
        this.setState({ sortType: sortType })
        this.sortDifferent(sortType)
      }
      else {

        let challenges = this.state.challenges
        if (sortType === "points") challenges = orderBy(challenges, ["points"], ["asc"])
        else if (sortType === "pointsrev") challenges = orderBy(challenges, ["points"], ["desc"])
        else if (sortType === "abc") challenges = orderBy(challenges, ["name"], ["asc"])
        else if (sortType === "abcrev") challenges = orderBy(challenges, ["name"], ["desc"])
        this.setState({ challenges: challenges })
      }

    }
  }

  sortByTags(findNOpenTag = false) {
    let originalData = this.props.currentCategoryChallenges
    let tag = {}
    this.setState({ loadingTag: true })

    if (!findNOpenTag) {
      for (const [key, value] of Object.entries(originalData)) {
        let currentCat = originalData[key]
        for (let x = 0; x < currentCat.length; x++) { //loop through each challenge

          if ("requires" in currentCat[x]) {
            // it needs to iterate through other catgories as well
            const requires = currentCat.find((value) => value._id === currentCat[x].requires)
            if (requires) {
              if (requires.solved) currentCat[x].requiresSolved = true
              else {
                currentCat[x].requiresSolved = false
                if ("name" in requires) currentCat[x].requiresName = requires.name
                else currentCat[x].requiresName = "REQUIRED-CHALLENGE-NOT-FOUND"
              }
            }
            else {
              for (const [innerCurrentCategory, value] of Object.entries(this.props.originalData)) {
                if (innerCurrentCategory !== key) { // avoid searching current cat again
                  const currentInnerCategory = this.props.originalData[innerCurrentCategory]
                  for (let i = 0; i < currentInnerCategory.length; i++) {
                    if (currentInnerCategory[i]._id === currentCat[x].requires) {
                      if (currentInnerCategory[i].solved) currentCat[x].requiresSolved = true
                      else {
                        currentCat[x].requiresSolved = false
                        if ("name" in currentInnerCategory[i]) currentCat[x].requiresName = currentInnerCategory[i].name
                        else currentCat[x].requiresName = "REQUIRED-CHALLENGE-NOT-FOUND"
                      }
                      break
                    }
                  }
                }
              }
            }
          }

          if ("tags" in currentCat[x]) {
            const firstTag = currentCat[x].tags[0] //grab the first tag of each challenge as the tag it will use in categorising
            if (firstTag.toLowerCase() in tag) {
              tag[firstTag.toLowerCase()].push(currentCat[x]) //add current challenge to that tag's category
            }
            else {
              tag[firstTag.toLowerCase()] = []
              tag[firstTag.toLowerCase()].push(currentCat[x])
            }

          }
          else {
            if ("Uncategorised" in tag) tag["Uncategorised"].push(currentCat[x])
            else {
              tag["Uncategorised"] = []
              tag["Uncategorised"].push(currentCat[x])
            }
          }
        }
      }
    }
    else {

      let found = false
      for (const [key, value] of Object.entries(originalData)) {
        let currentCat = originalData[key]
        for (let x = 0; x < currentCat.length; x++) { //loop through each challenge

          if (!found && currentCat[x].name === findNOpenTag) {
            if ("tags" in currentCat[x]) this.setState({ selectedTags: [currentCat[x].tags[0].toLowerCase()] })
            else this.setState({ selectedTags: ["Uncategorised"] })
            found = true
          }
          if ("requires" in currentCat[x]) {
            const requires = currentCat.find((value) => value._id === currentCat[x].requires)
            if (requires) {
              if (requires.solved) currentCat[x].requiresSolved = true
              else {
                if ("name" in requires) currentCat[x].requiresName = requires.name
                else currentCat[x].requiresName = "REQUIRED-CHALLENGE-NOT-FOUND"
              }
            }
            else {
              for (const [innerCurrentCategory, value] of Object.entries(this.props.originalData)) {
                if (innerCurrentCategory !== key) { // avoid searching current cat again
                  const currentInnerCategory = this.props.originalData[innerCurrentCategory]
                  for (let i = 0; i < currentInnerCategory.length; i++) {
                    if (currentInnerCategory[i]._id === currentCat[x].requires) {
                      if (currentInnerCategory[i].solved) currentCat[x].requiresSolved = true
                      else {
                        currentCat[x].requiresSolved = false
                        if ("name" in currentInnerCategory[i]) currentCat[x].requiresName = currentInnerCategory[i].name
                        else currentCat[x].requiresName = "REQUIRED-CHALLENGE-NOT-FOUND"
                      }
                      break
                    }
                  }
                }
              }
            }
          }

          if ("tags" in currentCat[x]) {
            const firstTag = currentCat[x].tags[0] //grab the first tag of each challenge as the tag it will use in categorising
            if (firstTag.toLowerCase() in tag) {
              tag[firstTag.toLowerCase()].push(currentCat[x]) //add current challenge to that tag's category
            }
            else {
              tag[firstTag.toLowerCase()] = []
              tag[firstTag.toLowerCase()].push(currentCat[x])
            }

          }
          else {
            if ("Uncategorised" in tag) tag["Uncategorised"].push(currentCat[x])
            else {
              tag["Uncategorised"] = []
              tag["Uncategorised"].push(currentCat[x])
            }
          }
        }
      }
    }
    let challenges = orderBy(this.props.currentCategoryChallenges[0], ["points"], ["asc"])
    //console.log(tag)
    this.setState({ tag: tag, loadingTag: false, challenges: challenges })

  }

  sortDifferent(sortType) {
    this.setState({ loadingTag: true })
    let tag = this.state.tag
    switch (sortType) {
      case 'points':
        for (const [key, value] of Object.entries(tag)) { //loop through each tag category and sort the challenges in each tag by points
          tag[key] = orderBy(tag[key], ['points'], ['asc'])

        }
        break
      case 'pointsrev':
        for (const [key, value] of Object.entries(tag)) { //loop through each tag category and sort the challenges in each tag by points
          tag[key] = orderBy(tag[key], ['points'], ['desc'])

        }
        break
      case 'abc':
        for (const [key, value] of Object.entries(tag)) { //loop through each tag category and sort the challenges in each tag by points
          tag[key] = orderBy(tag[key], ['name'], ['asc'])

        }
        break
      case 'abcrev':
        for (const [key, value] of Object.entries(tag)) { //loop through each tag category and sort the challenges in each tag by points
          tag[key] = orderBy(tag[key], ['name'], ['desc'])
        }
    }
    this.setState({ tag: tag, loadingTag: false })
  }

  handleBuyHint(close, id, challID) {
    fetch(window.ipAddress + "/v1/challenge/hint", {
      method: 'post',
      headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
      body: JSON.stringify({
        "id": parseInt(id),
        "chall": challID,
      })
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      //console.log(data)
      if (data.success === true) {
        message.success({ content: "Purchashed hint " + String(id + 1) + " successfully!" })
        let challengeHints = this.state.challengeHints
        challengeHints[id] = (
          <Button type="primary" key={"hint" + String(id) + challID} style={{ marginBottom: "1.5vh", backgroundColor: "#49aa19" }} onClick={() => { this.handleHint(id, challID, true) }}>Hint {id + 1} - Purchased</Button>
        )
        this.setState({ hintModal: true, hintContent: data.hint, challengeHints: challengeHints })
        this.props.obtainScore()
        close()
      }
    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting to the server" });
      close()
    })
  }

  handleHint(id, challID, bought) {

    if (bought === false) {
      confirm({
        title: 'Are you sure you want to purchase hint ' + parseInt(id + 1) + ' for "' + this.state.viewingChallengeDetails.name + '"?',
        icon: <ExclamationCircleOutlined />,
        onOk: (close) => { this.handleBuyHint(close.bind(this), id, challID) },
        onCancel() { },
      });
    }
    else {
      fetch(window.ipAddress + "/v1/challenge/hint", {
        method: 'post',
        headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        body: JSON.stringify({
          "id": parseInt(id),
          "chall": challID,
        })
      }).then((results) => {
        return results.json(); //return data in JSON (since its JSON data)
      }).then((data) => {
        //console.log(data)
        if (data.success === true) {
          this.setState({ hintModal: true, hintContent: data.hint })
          this.props.obtainScore()
        }
      }).catch((error) => {
        console.log(error)
        message.error({ content: "Oops. There was an issue connecting to the server" });
      })
    }

  }

  loadChallengeDetails = async (ID, solved) => {
    this.props.history.push("/Challenges/" + encodeURIComponent(ID));
    await this.setState({ currentChallenge: ID, loadingChallenge: true, currentChallengeSolved: solved, tagList: this.state.tagLists })
    if (solved === true) {
      this.setState({ currentChallengeStatus: "Challenge already solved." })
    }
    else {
      this.setState({ currentChallengeStatus: "Enter the flag (case-sensitive)" })
    }
    //document.getElementById(name).style.pointerEvents = "none"
    await fetch(window.ipAddress + "/v1/challenge/show/" + encodeURIComponent(ID), {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      //console.log(data)
      if (data.success === true) {

        //Handle unlimited attempts
        if (data.chall.max_attempts === 0) {
          data.chall.max_attempts = "Unlimited"

        }
        else {
          data.chall.max_attempts = String(data.chall.max_attempts - data.chall.used_attempts) + "/" + String(data.chall.max_attempts)
        }

        //Render tags
        if (typeof data.chall.tags !== "undefined") {
          const tag = data.chall.tags
          var renderTags = []

          for (let x = 0; x < tag.length; x++) {
            renderTags.push(
              <Tag color="#1765ad" key={tag[x]}>
                {tag[x]}
              </Tag>
            )
          }
        }

        //Render writeup link
        let writeupLink = ""
        if (typeof data.chall.writeup !== "undefined") {
          writeupLink = data.chall.writeup
        }
        else writeupLink = ""


        //Handle hints
        let renderHints = []
        if (typeof data.chall.hints !== "undefined") {
          const hints = data.chall.hints

          for (let y = 0; y < hints.length; y++) {
            if (hints[y].bought === false) {
              if (hints[y].cost === 0) {
                hints[y].cost = "Free"
              }
              else {
                hints[y].cost = String(hints[y].cost) + " Points"
              }
              renderHints.push(
                <Button type="primary" key={"hint " + String(y) + ID} style={{ marginBottom: "1.5vh" }} onClick={() => { this.handleHint(y, ID, false) }}>Hint {y + 1} - {hints[y].cost}</Button>
              )
            }
            else {
              renderHints.push(
                <Button type="primary" key={"hint " + String(y) + ID} style={{ marginBottom: "1.5vh", backgroundColor: "#49aa19" }} onClick={() => { this.handleHint(y, ID, true) }}>Hint {y + 1} - Purchased</Button>
              )
            }

          }
        }


        this.setState({ viewingChallengeDetails: data.chall, challengeModal: true, challengeTags: renderTags, challengeWriteup: writeupLink, challengeHints: renderHints })

      }
      else {
        if (data.error === "required-challenge-not-completed") message.warn("You need to complete the required challenge first.")
        else if (data.error === "required-challenge-not-found") message.error("The required challenge was not found. This is likely an error in the challenge settings. Please contact an admin")
        else {
          message.error({ content: "Oops. Unknown error" })
        }
        this.props.history.push("/Challenges/" + this.props.category);
      }

      //document.getElementById(name).style.pointerEvents = "auto"


    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })

    this.setState({ loadingChallenge: false })
  }

  submitFlag(values) {

    fetch(window.ipAddress + "/v1/challenge/submit", {
      method: 'post',
      headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
      body: JSON.stringify({
        "flag": values.flag,
        "chall": this.state.currentChallenge,
      })
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then(async (data) => {
      //console.log(data)
      if (data.success === true) {
        if (data.data === "correct") {
          notification["success"]({
            message: 'Challenge Solved! Congratulations!',
            description:
              'Congratulations on solving "' + this.state.viewingChallengeDetails.name + '".',
            duration: 5
          });
          this.setState({ challengeModal: false })
          this.props.history.push("/Challenges/" + this.props.category)
          await this.props.handleRefresh()
          this.sortByTags()

        }
        else {
          notification["error"]({
            message: 'Oops. Incorrect Flag',
            description:
              'It seems like you submitted an incorrect flag "' + values.flag + '" for "' + this.state.viewingChallengeDetails.name + '".',
            duration: 3
          });
          this.loadChallengeDetails(this.state.currentChallenge, false)
        }
      }
      else {
        if (data.error === "exceeded") {
          notification["error"]({
            message: 'Oops. Attempts Exhausted',
            description:
              'It seems like you have execeeded the maximum number of attempts for "' + this.state.viewingChallengeDetails.name + '". Contact an admin if you need more tries.',
            duration: 3
          });
          this.loadChallengeDetails(this.state.currentChallenge, false)
        }
        else if (data.error === "submitted") {
          notification["error"]({
            message: 'Challenge already solved.',
            description:
              'Your teammate might have already solved the challenge. Please refresh the page to see the latest solve status.',
            duration: 3
          });
          await this.props.handleRefresh()
        }
        else if (data.error === "admin-hidden") {
          notification["error"]({
            message: 'The challenge is hidden.',
            description:
              'Submission has been disabled as this challenge is hidden even for admins. This is to prevent challenge leakages.',
            duration: 3
          });
          this.loadChallengeDetails(this.state.currentChallenge, false)
        }
        else if (data.error === "required-challenge-not-completed") {
          notification["error"]({
            message: 'Oops. Required challenge not completed',
            description:
              'It seems like you have not completed the required challenge before doing this challenge.',
            duration: 3
          });
          this.loadChallengeDetails(this.state.currentChallenge, false)
        }
        else if (data.error === "required-challenge-not-found") {
          notification["error"]({
            message: 'Oops. Required challenge was not found',
            description:
              'This is likely an error in the challenge settings. Please contact an admin.',
            duration: 3
          });
          this.loadChallengeDetails(this.state.currentChallenge, false)
        }
        else if (data.error === "submission-disabled") {
          notification["error"]({
            message: 'Oops. Submission is disabled',
            description:
              'New flag submissions have been disabled. The competition might have ended/is not running.',
            duration: 3
          });
          this.loadChallengeDetails(this.state.currentChallenge, false)
        }
        else if (data.error === "InvalidFlagLength") {
          notification["error"]({
            message: 'Oops. Your flag is too long.',
            description:
              'Please do not spam the server with submissions that are too long.',
            duration: 3
          });
          this.loadChallengeDetails(this.state.currentChallenge, false)
        }
        else {
          console.log(data.error)
          message.error({ content: "Oops. Unknown error" })
        }
      }
    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting to the server" });
    })
  }

  render() {
    return (
      <Layout className="pageTransition" style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>

        <Modal
          title="Hint"
          visible={this.state.hintModal}
          onCancel={() => { this.setState({ hintModal: false }) }}
          footer={null}
        >
          <p>{this.state.hintContent}</p>
        </Modal>


        <Modal
          title={null}
          visible={this.state.challengeModal}
          footer={null}
          bodyStyle={{ textAlign: "center" }}
          onCancel={() => { this.setState({ challengeModal: false }); this.props.history.push("/Challenges/" + this.props.category); }}
        >
          <Tabs defaultActiveKey="challenge">
            <TabPane
              tab={<span><ProfileOutlined /> Challenge</span>}
              key="challenge"
            >

              {this.state.challengeWriteup !== "" && this.state.challengeWriteup !== "CompleteFirst" && (
                <Tooltip title="View writeups for this challenge">
                  <Button shape="circle" size="large" style={{ position: "absolute", right: "2ch" }} type="primary" icon={<SolutionOutlined />} onClick={() => { window.open(this.state.challengeWriteup) }} />
                </Tooltip>
              )}
              {this.state.challengeWriteup === "" && (
                <Tooltip title="Writeups are not available for this challenge">
                  <Button disabled shape="circle" size="large" style={{ position: "absolute", right: "2ch" }} type="primary" icon={<SolutionOutlined />} />
                </Tooltip>
              )}
              {this.state.challengeWriteup === "CompleteFirst" && (
                <Tooltip title="Writeups are available for this challenge but you must complete the challenge first to view it.">
                  <Button shape="circle" size="large" style={{ position: "absolute", right: "2ch", color: "#13a8a8" }} icon={<SolutionOutlined />} />
                </Tooltip>
              )}
              <Suspense fallback={<div style={{ height: "100%", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 15 }}>
                <Ellipsis color="#177ddc" size={120} ></Ellipsis>
              </div>}>

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <h1 style={{ fontSize: "150%", maxWidth: "35ch", whiteSpace: "initial" }}>{this.state.viewingChallengeDetails.name}
                    <Tooltip title="Copy challenge link to clipboard.">
                      <LinkOutlined style={{ color: "#1890ff", marginLeft: "0.5ch" }} onClick={
                        async () => {
                          await navigator.clipboard.writeText(window.location.href);
                          message.success("Challenge link copied to clipboard.")
                        }} /></Tooltip>
                  </h1>
                </div>
                <div>
                  {this.state.challengeTags}
                </div>
                <h2 style={{ color: "#1765ad", marginTop: "2vh", marginBottom: "6vh", fontSize: "200%" }}>{this.state.viewingChallengeDetails.points}</h2>

                <div className="challengeModal">
                  <MarkdownRender >{this.state.viewingChallengeDetails.description}</MarkdownRender>
                </div>



                <div style={{ marginTop: "6vh", display: "flex", flexDirection: "column" }}>
                  {this.state.challengeHints}
                </div>
              </Suspense>


              <div style={{ display: "flex" }}>
                <SubmitFlagForm submitFlag={this.submitFlag.bind(this)} currentChallengeStatus={this.state.currentChallengeStatus} currentChallengeSolved={this.state.currentChallengeSolved}></SubmitFlagForm>
              </div>
              <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "-1vh" }}>
                <p>Challenge Author: <em>{this.state.viewingChallengeDetails.author}</em></p>
                <p style={{ color: "#d87a16", fontWeight: 500 }}>Attempts Remaining: {this.state.viewingChallengeDetails.max_attempts}</p>
              </div>
            </TabPane>
            <TabPane
              tab={<span><UnlockOutlined /> Solves ({this.state.viewingChallengeDetails.solves.length}) </span>}
              key="solves"
            >
              <List
                itemLayout="horizontal"
                dataSource={this.state.viewingChallengeDetails.solves}
                locale={{
                  emptyText: (
                    <div>
                      <SmileOutlined style={{ fontSize: "500%" }} />
                      <br />
                      <br />
                      <p style={{ fontSize: "150%" }}>No solves yet. Maybe you can be the first!</p>
                    </div>
                  )
                }}
                renderItem={item => {
                  return (
                    <List.Item key={item}>
                      <List.Item.Meta
                        avatar={<Avatar src={"/static/profile/" + item + ".webp"} />}
                        title={<Link to={"/Profile/" + item}><a style={{ fontSize: "110%", fontWeight: 700 }} onClick={() => { this.setState({ challengeModal: false }) }}>{item}</a></Link>}
                      />
                    </List.Item>
                  )
                }
                } />
            </TabPane>
          </Tabs>


        </Modal>
        <Divider style={{ marginTop: "0px" }}>Select Tags</Divider>

        <span className="tag-holder" >
          {Object.keys(this.state.tag).map((tag) => {
            return (
              <CheckableTag className="tag-select-style" key={tag} checked={this.state.selectedTags.indexOf(tag) !== -1}
                onChange={(checked) => {

                  let selectedTags = this.state.selectedTags
                  if (!checked) selectedTags.splice(selectedTags.indexOf(tag), 1)
                  else selectedTags.push(tag)

                  if (selectedTags.length === 0) this.sortCats(this.state.sortType, true)

                  this.setState({ selectedTags: selectedTags })
                }}>{tag} <span style={{ color: "#d89614" }}>({this.state.tag[tag].length})</span></CheckableTag>
            )
          })}
        </span>

        <Divider />
        {this.state.tag && this.state.selectedTags.length > 0 ? (
          <ChallengesTagSortList tag={this.state.tag} selectedTags={this.state.selectedTags} permissions={this.props.permissions} loadChallengeDetails={this.loadChallengeDetails.bind(this)} loadingChallenge={this.state.loadingChallenge} currentChallenge={this.state.currentChallenge} />
        ) : (
          <List
            grid={{
              xs: 1,
              sm: 2,
              md: 2,
              lg: 3,
              xl: 4,
              xxl: 5,
              gutter: 20
            }}
            dataSource={this.state.challenges}
            locale={{
              emptyText: (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                  <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                  <h1 style={{ fontSize: "200%" }}>No challenges have been released yet</h1>
                </div>
              )
            }}
            renderItem={item => {
              if (item.solves.length === 0) item.firstBlood = "No First Blood Yet!"
              else {
                if (this.props.disableNonCatFB) {
                  item.firstBlood = "No First blood Yet"
                  for (let i = 0; i < item.solves.length; i++) {
                    if (this.props.userCategories[item.solves[i]] !== "none") {
                      item.firstBlood = item.solves[i]
                      break
                    }
                  }
                }
                else item.firstBlood = item.solves[0]
              }

              if (item.requires && !item.requiresSolved && this.props.permissions < 2) {

                return (
                  <List.Item key={item._id}>
                    <Tooltip title={<span>Please solve "<b><u>{item.requiresName}</u></b>" to unlock this challenge.</span>}>
                      <div id={item._id}>
                        <Card
                          type="inner"
                          bordered={true}
                          className="card-design"
                        >

                          <Meta
                            description={
                              <div className="card-design-body" >
                                <LockOutlined className="disabled-style" />
                                <h1 className="card-design-name" >{item.name}</h1>
                                <h1 className="card-design-points">{item.points}</h1>
                                <h1 className="card-design-firstblood"><img alt="First Blood" src={require("./../assets/blood.svg").default} /> {item.firstBlood}</h1>
                                {this.state.loadingChallenge && this.state.currentChallenge === item._id && (
                                  <div style={{ width: "100%", height: "100%", backgroundColor: "red", zIndex: 1 }}>
                                    <LoadingOutlined style={{ color: "#177ddc", fontSize: "500%", position: "absolute", zIndex: 1, left: "40%", top: "30%" }} />
                                  </div>
                                )}
                                {item.visibility === false && (
                                  <h1 style={{ color: "#d9d9d9" }}>Hidden Challenge <EyeInvisibleOutlined /></h1>
                                )}
                              </div>


                            }
                          />
                        </Card> {/*Pass entire datasource as prop*/}
                      </div>
                    </Tooltip>
                  </List.Item>
                )

              }
              else if (!item.solved) {
                return (
                  <List.Item key={item._id}>
                    <div id={item._id} onClick={() => { this.loadChallengeDetails(item._id, item.solved, item.firstBlood) }}>
                      <Card
                        hoverable
                        type="inner"
                        bordered={true}
                        className="card-design hover"
                      >
                        <Meta
                          description={
                            <div className="card-design-body">
                              <h1 className="card-design-name">{item.name}</h1>
                              <h1 className="card-design-points">{item.points}</h1>
                              <h1 className="card-design-firstblood"><img alt="First Blood" src={require("./../assets/blood.svg").default} /> {item.firstBlood}</h1>
                              {this.state.loadingChallenge && this.state.currentChallenge === item._id && (
                                <div style={{ width: "100%", height: "100%", backgroundColor: "red", zIndex: 1 }}>
                                  <LoadingOutlined style={{ color: "#177ddc", fontSize: "500%", position: "absolute", zIndex: 1, left: "40%", top: "30%" }} />
                                </div>
                              )}
                              {item.visibility === false && (
                                <h1 style={{ color: "#d9d9d9" }}>Hidden Challenge <EyeInvisibleOutlined /></h1>
                              )}
                            </div>


                          }
                        />
                      </Card> {/*Pass entire datasource as prop*/}
                    </div>
                  </List.Item>
                )
              }
              else {
                return (
                  <List.Item key={item._id}>
                    <div id={item._id} onClick={() => { this.loadChallengeDetails(item._id, item.solved) }}>
                      <Card
                        hoverable
                        type="inner"
                        bordered={true}
                        className="card-design solved hover"
                      >
                        <Meta
                          description={
                            <div className="card-design-body">
                              <CheckOutlined className="correct-style" />
                              <h1 className="card-design-name">{item.name}</h1>
                              <h1 className="card-design-points">{item.points}</h1>
                              <h1 className="card-design-firstblood"><img alt="First Blood" src={require("./../assets/blood.svg").default} /> {item.firstBlood}</h1>
                              {this.state.loadingChallenge && this.state.currentChallenge === item._id && (
                                <div style={{ width: "100%", height: "100%", backgroundColor: "red", zIndex: 1 }}>
                                  <LoadingOutlined style={{ color: "#177ddc", fontSize: "500%", position: "absolute", zIndex: 1, left: "40%", top: "30%" }} />
                                </div>
                              )}
                              {item.visibility === false && (
                                <h1 style={{ color: "#d9d9d9" }}>Hidden Challenge <EyeInvisibleOutlined /></h1>
                              )}
                            </div>


                          }
                        />
                      </Card> {/*Pass entire datasource as prop*/}
                    </div>
                  </List.Item>
                )
              }
            }
            }
          />)}
      </Layout>

    );
  }
}

export default ChallengesTagSort;
