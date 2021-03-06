import React from 'react';
import { Layout, Menu, Table, message, Dropdown, Button, Modal, Transfer, Divider } from 'antd';
import {
    ExclamationCircleOutlined,
    DeleteOutlined,
    FlagOutlined,
    EditOutlined,
    FileUnknownTwoTone,
    EyeOutlined,
    EyeInvisibleOutlined,
    RedoOutlined,
} from '@ant-design/icons';
import './App.min.css';
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
            selectedTableKeys: [],
            disableEditButtons: true,
            targetKeys: [],
            allCat: [],
            transferDisabled: false,
            refreshLoading: false
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
        this.handleRefresh()
    }


    handleCategoryData = async () => {
        this.setState({ transferDisabled: true })
        let visibleCat = []
        let allCat = []

        await Promise.all([fetch(window.ipAddress + "/v1/challenge/list_categories", {
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

            , fetch(window.ipAddress + "/v1/challenge/list_all_categories", {
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
        ])

        let invisible = difference(allCat, visibleCat)
        /*console.log(invisible)
        console.log(allCat)
        console.log(visibleCat)*/

        for (let i = 0; i < allCat.length; i++) {
            allCat[i] = { "key": allCat[i] }
        }
        this.setState({ targetKeys: invisible, allCat: allCat, transferDisabled: false })
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

    editChallengeVisibility(visibility, challenges) {
        this.setState({disableEditButtons: true})
        fetch(window.ipAddress + "/v1/challenge/edit/visibility", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                "visibility": visibility,
                "challenges": challenges,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success("The visibility of (" + challenges.join(", ") + ") challenge(s) have been updated")
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }
            this.setState({disableEditButtons: false})
            this.fillTableData()


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    fillTableData = async () => {
        this.setState({ loading: true })
        await fetch(window.ipAddress + "/v1/challenge/list_all", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {

            if (data.success === true) {
                for (var i = 0; i < data.challenges.length; i++) {
                    data.challenges[i].key = data.challenges[i].name
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



    deleteChallenge = async (close, challenges) => {
        this.setState({disableEditButtons: true})
        await fetch(window.ipAddress + "/v1/challenge/delete", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
            body: JSON.stringify({
                "chall": challenges,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "Deleted challenges (" + challenges.join(", ") + ") successfully" })
                this.handleRefresh()

            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }
            

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({selectedTableKeys: []})
        close()

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
        this.handleRefresh()
    }

    handleEditChallBack() {
        this.props.history.push("/Admin/Challenges")
        this.setState({ editChallenge: false })
        this.handleRefresh()
    }

    handleRefresh = async () => {
        await Promise.all([this.fillTableData(), this.handleCategoryData()])
    }

    handleTableSelect = (selectedRowKeys) => {
        this.setState({ selectedTableKeys: selectedRowKeys })
        if (this.state.disableEditButtons && selectedRowKeys.length > 0) this.setState({disableEditButtons: false})
        else if (!this.state.disableEditButtons && selectedRowKeys.length === 0) this.setState({disableEditButtons: true})
        
    }





    render() {
        return (

            <Layout style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>



                <div style={{ display: (!this.state.challengeCreate && !this.state.editChallenge) ? "initial" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", height: "2ch" }}>
                            <Button type="primary" style={{ marginBottom: "2vh", marginRight: "1ch" }} icon={<FlagOutlined />} onClick={() => { this.setState({ challengeCreate: true }, this.props.history.push("/Admin/Challenges/Create")) }}>Create New Challenge</Button>
                            {this.state.loading && (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                    <Ellipsis color="#177ddc" size={60} />
                                    <h1>Loading Challenges</h1>
                                </div>
                            )}
                        </div>
                        <Button loading={this.state.loading} type="primary" shape="circle" size="large" style={{ marginBottom: "2vh", maxWidth: "25ch" }} icon={<RedoOutlined />} onClick={async () => { await this.handleRefresh(); message.success("Challenge list refreshed.") }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <Button disabled={this.state.disableEditButtons} type="default" style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#6e6e6e" }} icon={<EyeOutlined style={{ color: "#49aa19" }} />} onClick={() => { this.editChallengeVisibility(true, this.state.selectedTableKeys) }}>Show</Button>
                        <Button disabled={this.state.disableEditButtons} type="default" style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#6e6e6e" }} icon={<EyeInvisibleOutlined style={{ color: "#d32029" }} />} onClick={() => { this.editChallengeVisibility(false, this.state.selectedTableKeys) }}>Hide</Button>
                        <Button disabled={this.state.disableEditButtons} style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#a61d24" }} icon={<DeleteOutlined />} onClick={() => {
                            confirm({
                                confirmLoading: this.state.disableEditButtons,
                                title: 'Are you sure you want to delete the challenge(s) (' + this.state.selectedTableKeys.join(", ") + ')? This action is irreversible.',
                                icon: <ExclamationCircleOutlined />,
                                onOk: (close) => { this.deleteChallenge(close.bind(this), this.state.selectedTableKeys) },
                                onCancel: () => { },
                            });
                        }}>Delete Challenges</Button>
                    </div>
                    <Table rowSelection={{ selectedRowKeys: this.state.selectedTableKeys, onChange: this.handleTableSelect.bind(this) }} style={{ overflow: "auto" }} dataSource={this.state.dataSource} locale={{
                        emptyText: (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                                <h1 style={{ fontSize: "200%" }}>No Challenges Have Been Created.</h1>
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
                                <Button icon={<EditOutlined/>} onClick={() => { this.setState({ editChallenge: true, challengeName: record.name }, this.props.history.push("/Admin/Challenges/Edit")) }}> Edit</Button>
                            )}
                        />
                    </Table>

                    <Divider />
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <h1 style={{ fontSize: "150%" }}>Category Management </h1>{this.state.transferDisabled && (<Ellipsis color="#177ddc" size={50} />)}
                    </div>

                    <Transfer
                        dataSource={this.state.allCat}
                        titles={[<span style={{ color: "#49aa19" }}>Visible Categories <EyeOutlined /></span>, <span style={{ color: "#d32029" }} >Hidden Categories <EyeInvisibleOutlined /></span>]}
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


                <Switch>
                    <Route exact path='/Admin/Challenges/Create' render={(props) => <AdminChallengeCreate {...props} handleBack={this.handleBack.bind(this)} handleCreateBack={this.handleCreateBack.bind(this)} allCat={this.state.allCat} />} />
                    <Route exact path='/Admin/Challenges/Edit' render={(props) => <AdminChallengeEdit {...props} allCat={this.state.allCat} challengeName={this.state.challengeName} handleEditBack={this.handleEditBack.bind(this)} handleEditChallBack={this.handleEditChallBack.bind(this)} />} />

                </Switch>

            </Layout>
        );
    }
}

export default AdminChallenges;