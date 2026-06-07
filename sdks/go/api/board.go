package api

import (
	"fmt"
	"net/url"
)

type BoardService struct {
	client *Client
}

type CreateBoardPayload struct {
	WorkspaceName string `json:"workspaceName"`
	Name          string `json:"name"`
	RepoName      string `json:"repoName,omitempty"`
}

type DeletedBoard struct {
	Name           string `json:"name"`
	WorkspaceName  string `json:"workspaceName"`
	RepositoryName string `json:"repositoryName"`
	TimeLeftString string `json:"timeLeftString"`
}

type GenericMessageResponse struct {
	Message string `json:"message"`
}

type UpdateBoardStatusResponse struct {
	Message  string `json:"message"`
	IsActive bool   `json:"isActive"`
}

type UpdateBoardStatusBody struct {
	WorkspaceName string `json:"workspaceName"`
	BoardName     string `json:"boardName"`
	IsActive      bool   `json:"isActive"`
}

type InviteMemberBody struct {
	WorkspaceName string `json:"workspaceName"`
	BoardName     string `json:"boardName"`
	Identifier    string `json:"identifier"`
}

func (s *BoardService) CreateBoard(req CreateBoardPayload) (interface{}, error) {
	var resp struct {
		Board interface{} `json:"board"`
	}
	err := s.client.doRequest("POST", "/boards", req, &resp)
	return resp.Board, err
}

func (s *BoardService) DeleteBoard(workspaceName, boardName string) (*GenericMessageResponse, error) {
	endpoint := fmt.Sprintf("/boards?workspace=%s&board=%s", url.QueryEscape(workspaceName), url.QueryEscape(boardName))
	var resp GenericMessageResponse
	err := s.client.doRequest("DELETE", endpoint, nil, &resp)
	return &resp, err
}

func (s *BoardService) RestoreBoard(workspaceName, boardName string) (*GenericMessageResponse, error) {
	endpoint := fmt.Sprintf("/boards/restore?workspace=%s&board=%s", url.QueryEscape(workspaceName), url.QueryEscape(boardName))
	var resp GenericMessageResponse
	err := s.client.doRequest("PUT", endpoint, nil, &resp)
	return &resp, err
}

func (s *BoardService) GetDeletedBoards() ([]DeletedBoard, error) {
	var resp struct {
		Boards []DeletedBoard `json:"boards"`
	}
	err := s.client.doRequest("GET", "/boards/deleted", nil, &resp)
	return resp.Boards, err
}

func (s *BoardService) UpdateBoardStatus(workspaceName, boardName string, isActive bool) (*UpdateBoardStatusResponse, error) {
	endpoint := "/boards/status"
	body := UpdateBoardStatusBody{
		WorkspaceName: workspaceName,
		BoardName:     boardName,
		IsActive:      isActive,
	}
	var resp UpdateBoardStatusResponse
	err := s.client.doRequest("PUT", endpoint, body, &resp)
	return &resp, err
}

func (s *BoardService) LeaveBoard(workspaceName, boardName string) error {
	endpoint := fmt.Sprintf("/boards/members/leave?workspace=%s&board=%s", url.QueryEscape(workspaceName), url.QueryEscape(boardName))
	return s.client.doRequest("DELETE", endpoint, nil, nil)
}

func (s *BoardService) InviteMember(workspaceName, boardName, identifier string) (interface{}, error) {
	endpoint := "/boards/members"
	body := InviteMemberBody{
		WorkspaceName: workspaceName,
		BoardName:     boardName,
		Identifier:    identifier,
	}
	var resp struct {
		Member interface{} `json:"member"`
	}
	err := s.client.doRequest("POST", endpoint, body, &resp)
	return resp.Member, err
}

func (s *BoardService) RemoveMember(workspaceName, boardName, identifier string) (*GenericMessageResponse, error) {
	endpoint := fmt.Sprintf("/boards/members?workspace=%s&board=%s&identifier=%s", url.QueryEscape(workspaceName), url.QueryEscape(boardName), url.QueryEscape(identifier))
	var resp GenericMessageResponse
	err := s.client.doRequest("DELETE", endpoint, nil, &resp)
	return &resp, err
}
