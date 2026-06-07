package api

import "time"

type NotificationService struct {
	client *Client
}

type NotificationLog struct {
	Type      string             `json:"type"`
	CreatedAt time.Time          `json:"createdAt"`
	Actor     *NotificationActor `json:"actor,omitempty"`
	Board     *NotificationBoard `json:"board,omitempty"`
	Task      *NotificationTask  `json:"task,omitempty"`
}

type NotificationActor struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type NotificationBoard struct {
	Name      string                 `json:"name"`
	Workspace *NotificationWorkspace `json:"workspace,omitempty"`
}

type NotificationWorkspace struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type NotificationTask struct {
	Title  string `json:"title"`
	Status string `json:"status"`
}

type GetReadStateResponse struct {
	LastRead *string `json:"lastRead"`
}

type SuccessResponse struct {
	Success bool `json:"success"`
}

func (s *NotificationService) GetNotifications() ([]NotificationLog, error) {
	var resp struct {
		Logs []NotificationLog `json:"logs"`
	}
	err := s.client.doRequest("GET", "/notifications", nil, &resp)
	return resp.Logs, err
}

func (s *NotificationService) GetReadState() (*GetReadStateResponse, error) {
	var resp GetReadStateResponse
	err := s.client.doRequest("GET", "/notifications/read", nil, &resp)
	return &resp, err
}

func (s *NotificationService) MarkAsRead() (*SuccessResponse, error) {
	var resp SuccessResponse
	err := s.client.doRequest("POST", "/notifications/read", nil, &resp)
	return &resp, err
}
