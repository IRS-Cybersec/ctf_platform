import React from 'react';
import { Layout, Menu, Table, message, Dropdown, Button, Modal, Transfer, Divider } from 'antd';
import {
    LoadingOutlined,
    ExclamationCircleOutlined,
    DeleteOutlined,
    FlagOutlined,
    EditOutlined,
    FileUnknownTwoTone,
    EyeOutlined,
    EyeInvisibleOutlined
} from '@ant-design/icons';
import './App.css';
import AdminChallengeCreate from "./adminChallengeCreate.js";
import AdminChallengeEdit from "./adminChallengeEdit.js";
import { difference } from "lodash";
import { Ellipsis } from 'react-spinners-css';
import { Switch, Route, Link } from 'react-router-dom';

const { Column } = Table;
const { confirm } = Modal;



class AdminChallenges extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            dataSource: [],
            challengeName: "",
            modalLoading: false,
            challengeCreate: false,
            editChallenge: false,
            selectedKeys: [],
            targetKeys: [],
            allCat: [],
            transferDisabled: false
        }
    }

      componentDidUpdate(prevProps) {
    // Handle any page changes 
    if (this.state.editChallenge && this.props.location.pathname !== "/Admin/Challenges/Edit") {
      this.setState({ editChallenge: false })
    }
    else if (this.state.challengeCreate && this.props.location.pathname !== "/Admin/Challenges/Create") {
        this.setState({ challengeCreate: false })
    }
  }


    componentDidMount = async () => {
        const location = this.props.location.pathname
        if (location === "/Admin/Challenges/Create") {
            await this.setState({ challengeCreate: true })
        }
        else if (location === "/Admin/Challenges/Edit") {
            message.warn("Please select a challenge from the table to edit")
            await this.props.history.push("/Admin/Challenges")
        }
        this.fillTableData()
        this.handleCategoryData()
    }


    handleCategoryData() {
        this.setState({ transferDisabled: true })
        let visibleCat = []
        let allCat = []

        const getInfo = async () => {
            fetch(window.ipAddress + "/v1/challenge/list_categories", {
                method: 'get',
                headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            }).then((results) => {
                return results.json(); //return data in JSON (since its JSON data)
            }).then((data) => {

                if (data.success === true) {
                    visibleCat = data.categories
                }
                else {
                    message.error({ content: "Oops. Unknown error" })
                }


            }).catch((error) => {
                console.log(error)
                message.error({ content: "Oops. There was an issue connecting with the server" });
            })

            await fetch(window.ipAddress + "/v1/challenge/list_all_categories", {
                method: 'get',
                headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            }).then((results) => {
                return results.json(); //return data in JSON (since its JSON data)
            }).then((data) => {

                if (data.success === true) {
                    allCat = data.categories
                }
                else {
                    message.error({ content: "Oops. Unknown error" })
                }


            }).catch((error) => {
                console.log(error)
                message.error({ content: "Oops. There was an issue connecting with the server" });
            })


        }

        (async () => {
            await getInfo()
            let invisible = difference(allCat, visibleCat)
            /*console.log(invisible)
            console.log(allCat)
            console.log(visibleCat)*/

            for (let i = 0; i < allCat.length; i++) {
                allCat[i] = { "key": allCat[i] }
            }
            this.setState({ targetKeys: invisible, allCat: allCat, transferDisabled: false })
        })()
    }

    handleChange = (nextTargetKeys, direction, moveKeys) => {
        this.setState({ targetKeys: nextTargetKeys, transferDisabled: true });

        if (direction === "right") {
            this.editCategoryVisibility(false, moveKeys)
        }
        else {
            this.editCategoryVisibility(true, moveKeys)
        }
    }

    handleSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
        this.setState({ selectedKeys: [...sourceSelectedKeys, ...targetSelectedKeys] })
    }

    editCategoryVisibility(visbility, categories) {

        fetch(window.ipAddress + "/v1/challenge/edit/category", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                "visibility": visbility,
                "category": categories,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success("The visibility of (" + categories.join(", ") + ") categories has been updated")
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }
            this.setState({ transferDisabled: false })
            this.fillTableData()


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    fillTableData = () => {
        this.setState({ loading: true })
        fetch(window.ipAddress + "/v1/challenge/list_all", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {

            if (data.success === true) {
                for (var i = 0; i < data.challenges.length; i++) {
                    if (data.challenges[i].visibility === false) {
                        data.challenges[i].visibility = <span style={{ color: "#d32029" }}>Hidden <EyeInvisibleOutlined /></span>
                    }
                    else {
                        data.challenges[i].visibility = <span style={{ color: "#49aa19" }}>Visible <EyeOutlined /></span>
                    }
                }
                this.setState({ dataSource: data.challenges, loading: false })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }



    deleteChallenge = (close, challengeName) => {
        fetch(window.ipAddress + "/v1/challenge/delete", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                "chall": challengeName,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "Deleted challenge \"" + challengeName + "\" successfully" })
                this.fillTableData()
                this.handleCategoryData()

            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }
            close()



        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
            close()
        })

    }

    handleBack = async () => {
        await this.props.history.push("/Admin/Challenges")
        if (this.props.location.pathname === "/Admin/Challenges") this.setState({ challengeCreate: false })
    }

    handleEditBack = async () => {
        await this.props.history.push("/Admin/Challenges")
        if (this.props.location.pathname === "/Admin/Challenges") this.setState({ editChallenge: false })
    }

    handleCreateBack() {
        this.props.history.push("/Admin/Challenges")
        this.setState({ challengeCreate: false })
        this.fillTableData()
        this.handleCategoryData()
    }

    handleEditChallBack() {
        this.props.history.push("/Admin/Challenges")
        this.setState({ editChallenge: false })
        this.fillTableData()
        this.handleCategoryData()
    }





    render() {
        return (

            <Layout style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>

                {this.state.loading && (
                    <div style={{ position: "absolute", left: "55%", transform: "translate(-55%, 0%)", zIndex: 10 }}>
                        <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                    </div>
                )}
                {!this.state.loading && (
                    <div>

                        {!this.state.challengeCreate && !this.state.editChallenge && (
                            <div>

                                <Button type="primary" style={{ marginBottom: "2vh", maxWidth: "25ch" }} icon={<FlagOutlined />} onClick={() => { this.setState({ challengeCreate: true }, this.props.history.push("/Admin/Challenges/Create")) }}>Create New Challenge</Button>

                                <Table style={{ overflow: "auto" }} dataSource={this.state.dataSource} locale={{
                                    emptyText: (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                            <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                            <h1 style={{ fontSize: "200%" }}>There are no challenges created.</h1>
                                        </div>
                                    )
                                }}>
                                    <Column title="Name" dataIndex="name" key="name" render={(text, row, index) => {
                                        return <Link to={"/Challenges/" + row.category + "/" + row.name}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                                    }} />
                                    <Column title="Category" dataIndex="category" key="category" render={(text, row, index) => {
                                        return <Link to={"/Challenges/" + row.category}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                                    }} />
                                    <Column title="Points" dataIndex="points" key="points" />
                                    <Column title="Visbility" dataIndex="visibility" key="visibility" />
                                    <Column
                                        title=""
                                        key="edit"
                                        render={(text, record) => (
                                            <Dropdown trigger={['click']} overlay={
                                                <Menu>
                                                    <Menu.Item onClick={() => { this.setState({ editChallenge: true, challengeName: record.name }, this.props.history.push("/Admin/Challenges/Edit")) }}>
                                                        <span>
                                                            Edit Challenge <EditOutlined />
                                                        </span>
                                                    </Menu.Item>
                                                    <Menu.Divider />
                                                    <Menu.Item onClick={() => {
                                                        confirm({
                                                            title: 'Are you sure you want to delete the challenge \"' + record.name + '\"? This action is irreversible.',
                                                            icon: <ExclamationCircleOutlined />,
                                                            onOk: (close) => { this.deleteChallenge(close.bind(this), record.name) },
                                                            onCancel: () => { },
                                                        });
                                                    }}>
                                                        <span style={{ color: "#d32029" }} >
                                                            Delete Challenge <DeleteOutlined />
                                                        </span>
                                                    </Menu.Item>
                                                </Menu>
                                            } placement="bottomCenter">
                                                <Button>Actions</Button>
                                            </Dropdown>
                                        )}
                                    />
                                </Table>
                                <Divider />
                                <h1 style={{ fontSize: "150%" }}>Category Management {this.state.transferDisabled && (<LoadingOutlined style={{ color: "#177ddc" }} />)}</h1>

                                <Transfer
                                    dataSource={this.state.allCat}
                                    titles={['Visible Categories', 'Hidden Categories']}
                                    targetKeys={this.state.targetKeys}
                                    selectedKeys={this.state.selectedKeys}
                                    onChange={this.handleChange}
                                    onSelectChange={this.handleSelectChange}
                                    render={item => item.key}
                                    pagination
                                    disabled={this.state.transferDisabled}
                                />

                                <Divider />
                            </div>
                        )}
                        <Switch>
                            <Route exact path='/Admin/Challenges/Create' render={(props) => <AdminChallengeCreate {...props} handleBack={this.handleBack.bind(this)} handleCreateBack={this.handleCreateBack.bind(this)} allCat={this.state.allCat} />} />
                            <Route exact path='/Admin/Challenges/Edit' render={(props) => <AdminChallengeEdit {...props} allCat={this.state.allCat} challengeName={this.state.challengeName} handleEditBack={this.handleEditBack.bind(this)} handleEditChallBack={this.handleEditChallBack.bind(this)} />} />

                        </Switch>



                    </div>
                )}

            </Layout>
        );
    }
}

export default AdminChallenges;