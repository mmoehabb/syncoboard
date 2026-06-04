package api

import "fmt"

type DeletedBoard struct {
	Name           string `json:"name"`
	WorkspaceName  string `json:"workspaceName"`
	RepositoryName string `json:"repositoryName"`
	TimeLeftString string `json:"timeLeftString"`
}

func GetDeletedBoards() ([]DeletedBoard, error) {
	var boards []DeletedBoard
	err := doRequest("GET", "/boards/deleted", nil, &boards)
	return boards, err
}

func DeleteBoard(workspaceName, boardName string) error {
	endpoint := fmt.Sprintf("/workspaces/%s/boards/%s", workspaceName, boardName)
	return doRequest("DELETE", endpoint, nil, nil)
}

func RestoreBoard(workspaceName, boardName string) error {
	endpoint := fmt.Sprintf("/workspaces/%s/boards/%s/restore", workspaceName, boardName)
	return doRequest("POST", endpoint, nil, nil)
}

type UpdateBoardStatusBody struct {
	IsActive bool `json:"isActive"`
}

func UpdateBoardStatus(workspaceName, boardName string, isActive bool) error {
	endpoint := fmt.Sprintf("/workspaces/%s/boards/%s/status", workspaceName, boardName)
	body := UpdateBoardStatusBody{IsActive: isActive}
	return doRequest("PUT", endpoint, body, nil)
}

type InviteMemberBody struct {
	Identifier string `json:"identifier"`
}

func InviteMember(workspaceName, boardName, identifier string) error {
	endpoint := fmt.Sprintf("/workspaces/%s/boards/%s/members/invite", workspaceName, boardName)
	body := InviteMemberBody{Identifier: identifier}
	return doRequest("POST", endpoint, body, nil)
}

func RemoveMember(workspaceName, boardName, identifier string) error {
	endpoint := fmt.Sprintf("/workspaces/%s/boards/%s/members/%s", workspaceName, boardName, identifier)
	return doRequest("DELETE", endpoint, nil, nil)
}
