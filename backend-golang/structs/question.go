package structs

type QuestionRequest struct {
	Type          string `json:"type" binding:"required,oneof=text_text text_image image_text image_image"`
	QuestionText  string `json:"question_text"`
	QuestionImage string `json:"question_image"`
	OptionAText   string `json:"option_a_text"`
	OptionAImage  string `json:"option_a_image"`
	OptionBText   string `json:"option_b_text"`
	OptionBImage  string `json:"option_b_image"`
	OptionCText   string `json:"option_c_text"`
	OptionCImage  string `json:"option_c_image"`
	OptionDText   string `json:"option_d_text"`
	OptionDImage  string `json:"option_d_image"`
	CorrectAnswer string `json:"correct_answer" binding:"required,oneof=A B C D"`
	Points        int    `json:"points" binding:"omitempty,min=1"`
}

type AdminQuestionResponse struct {
	Id            uint   `json:"id"`
	SectionId     uint   `json:"section_id"`
	Type          string `json:"type"`
	QuestionText  string `json:"question_text"`
	QuestionImage string `json:"question_image"`
	OptionAText   string `json:"option_a_text"`
	OptionAImage  string `json:"option_a_image"`
	OptionBText   string `json:"option_b_text"`
	OptionBImage  string `json:"option_b_image"`
	OptionCText   string `json:"option_c_text"`
	OptionCImage  string `json:"option_c_image"`
	OptionDText   string `json:"option_d_text"`
	OptionDImage  string `json:"option_d_image"`
	CorrectAnswer string `json:"correct_answer"`
	Points        int    `json:"points"`
	CreatedAt     string `json:"created_at"`
	UpdatedAt     string `json:"updated_at"`
}
