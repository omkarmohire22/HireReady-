from datetime import datetime
from sqlalchemy.orm import Session
from database.models import Session as SessionModel, Answer as AnswerModel, Report as ReportModel
import os
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

class ReportBuilderService:
    @staticmethod
    def generate_report(db: Session, session_id: int, user_id: int):
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            raise ValueError("Session not found")

        # Fetch ALL real answers from the database for this session
        answers = db.query(AnswerModel).filter(AnswerModel.session_id == session_id).all()

        total_answers = len(answers)
        overall_score = (
            round(sum(ans.score or 0.0 for ans in answers) / total_answers, 2)
            if total_answers > 0 else 0.0
        )

        # Build per-question breakdown from real answer rows
        questions_breakdown = []
        for ans in answers:
            questions_breakdown.append({
                "question_id":   ans.question_id,
                "question_text": ans.question_text,
                "answer_text":   ans.answer_text or "",
                "score":         round(ans.score or 0.0, 2),
                "feedback":      ans.feedback or "No feedback recorded.",
                "strengths":     ans.strengths or [],
                "improvements":  ans.improvements or [],
                "keywords_used": ans.keywords_used or [],
                "keywords_missed": ans.keywords_missed or [],
                "filler_word_count": ans.filler_word_count or 0,
                "communication_metrics": ans.communication_metrics or {},
            })

        # Skill-level scores (average per skill from missing_skills list)
        skill_scores = {}
        for i, skill in enumerate(session.missing_skills or []):
            # Find the answer that corresponded to this skill's question
            if i < len(answers):
                skill_scores[skill] = round(answers[i].score or 0.0, 2)
            else:
                skill_scores[skill] = 0.0

        # ── Derive REAL category scores from actual per-answer metrics ──
        tech_score = overall_score

        # Aggregate advanced voice metrics from real analysis data
        total_wpm = 0
        total_fillers = 0
        total_pauses = 0
        valid_wpm_count = 0
        
        # Real communication sub-scores from voice_analyzer
        pace_scores = []
        pause_scores = []
        energy_scores = []
        filler_scores = []
        tone_scores = []
        depth_scores_list = []

        DIFFICULTY_WORD_TARGETS = {"Easy": 30, "Medium": 60, "Hard": 100}

        for ans in answers:
            total_fillers += ans.filler_word_count or 0
            cm = ans.communication_metrics or {}

            # WPM / Pace
            wpm = cm.get("wpm", 0)
            if wpm > 0:
                total_wpm += wpm
                valid_wpm_count += 1

            # Pause count
            total_pauses += cm.get("pause_count", 0)

            # Collect real sub-scores if present (scale 0-10 from voice_analyzer)
            if cm.get("pace_score") is not None:
                pace_scores.append(float(cm["pace_score"]))
            if cm.get("pause_score") is not None:
                pause_scores.append(float(cm["pause_score"]))
            if cm.get("energy_consistency_score") is not None:
                energy_scores.append(float(cm["energy_consistency_score"]))
            if cm.get("filler_score") is not None:
                filler_scores.append(float(cm["filler_score"]))
            if cm.get("confidence_score") is not None:
                tone_scores.append(float(cm["confidence_score"]))

            # Depth: word count vs difficulty target + keyword coverage
            word_count = len((ans.answer_text or "").split())
            difficulty = session.difficulty or "Medium"
            target_wc = DIFFICULTY_WORD_TARGETS.get(difficulty, 60)
            length_ratio = min(word_count / target_wc, 1.0) if target_wc > 0 else 0.5
            kw_used = len(ans.keywords_used or [])
            kw_missed = len(ans.keywords_missed or [])
            kw_ratio = kw_used / max(kw_used + kw_missed, 1)
            depth_scores_list.append((length_ratio * 0.5 + kw_ratio * 0.5) * 100.0)

        avg_wpm = round(total_wpm / valid_wpm_count) if valid_wpm_count > 0 else 0

        # Communication score: average of real pace, pause, energy, filler sub-scores (0-10 → 0-100)
        if pace_scores or pause_scores or energy_scores or filler_scores:
            all_comm = []
            for bucket in [pace_scores, pause_scores, energy_scores, filler_scores]:
                if bucket:
                    all_comm.append(sum(bucket) / len(bucket))
            comms_score = (sum(all_comm) / len(all_comm)) * 10.0 if all_comm else tech_score
        else:
            # Fallback for text-only or legacy answers without voice metrics
            comms_score = min(100.0, tech_score * 1.05) if tech_score > 0 else 0.0

        # Confidence score: from real VADER tone analysis (0-10 → 0-100)
        if tone_scores:
            confidence_score = (sum(tone_scores) / len(tone_scores)) * 10.0
        else:
            confidence_score = min(100.0, tech_score * 1.10) if tech_score > 0 else 0.0

        # Depth score: from real word count and keyword analysis
        if depth_scores_list:
            depth_score = sum(depth_scores_list) / len(depth_scores_list)
        else:
            depth_score = min(100.0, tech_score * 0.95) if tech_score > 0 else 0.0

        category_scores = {
            "technical_accuracy": round(tech_score, 2),
            "communication":      round(comms_score, 2),
            "depth":              round(depth_score, 2),
            "confidence":         round(confidence_score, 2),
            "avg_wpm":            avg_wpm,
            "total_fillers":      total_fillers,
            "total_pauses":       total_pauses,
        }

        # Dynamic strengths and improvements from all answers combined
        all_strengths = []
        all_improvements = []
        for ans in answers:
            all_strengths.extend(ans.strengths or [])
            all_improvements.extend(ans.improvements or [])

        # Deduplicate
        all_strengths = list(dict.fromkeys(all_strengths))[:5]
        all_improvements = list(dict.fromkeys(all_improvements))[:5]

        # Auto-generate summary
        if overall_score >= 80:
            summary = f"Excellent performance! You scored {overall_score:.0f}/100 across {total_answers} question(s) for the {session.target_role} role."
        elif overall_score >= 60:
            summary = f"Solid performance scoring {overall_score:.0f}/100 across {total_answers} question(s). Some areas need improvement."
        elif total_answers == 0:
            summary = "No answers were recorded for this session. Please complete at least one question to generate a full report."
        else:
            summary = f"You scored {overall_score:.0f}/100. More practice in {session.target_role} concepts will help significantly."

        # Upsert the report
        report = db.query(ReportModel).filter(ReportModel.session_id == session_id).first()
        if not report:
            report = ReportModel(session_id=session_id, user_id=user_id)
            db.add(report)

        report.overall_score           = overall_score
        report.skill_scores            = skill_scores
        report.category_scores         = category_scores
        report.strengths               = all_strengths
        report.areas_to_improve        = all_improvements
        report.missing_skills          = session.missing_skills or []
        report.session_summary         = summary
        report.recommended_resources   = _build_resources(session.missing_skills or [], session.target_role)
        
        report.category_scores = {
            **category_scores,
            "_questions_breakdown": questions_breakdown,  # real Q&A pairs
            "_target_role":         session.target_role,
            "_session_type":        session.session_type,
            "_difficulty":          session.difficulty,
            "_questions_count":     total_answers,
        }
        
        pdf_path = ReportBuilderService._generate_pdf_report(session_id, answers, report)
        report.pdf_path                = pdf_path
        
        report.generated_at            = datetime.utcnow()

        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def _generate_pdf_report(session_id: int, answers: list, report: ReportModel) -> str:
        """Generates a stunning, premium PDF report using ReportLab and returns the file path."""
        try:
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            
            os.makedirs("uploads", exist_ok=True)
            pdf_filename = f"report_{session_id}.pdf"
            pdf_path = os.path.join("uploads", pdf_filename)
            
            # margins are 36 points (0.5 inch), printable width = 595 - 72 = 523
            doc = SimpleDocTemplate(
                pdf_path, 
                pagesize=A4,
                leftMargin=36,
                rightMargin=36,
                topMargin=36,
                bottomMargin=36
            )
            elements = []
            styles = getSampleStyleSheet()
            
            # Define custom styles
            title_style = ParagraphStyle(
                'ReportTitle',
                parent=styles['Heading1'],
                fontName='Helvetica-Bold',
                fontSize=22,
                leading=26,
                textColor=colors.HexColor("#1E293B"),
                spaceAfter=4
            )
            subtitle_style = ParagraphStyle(
                'ReportSubtitle',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=10,
                leading=14,
                textColor=colors.HexColor("#4F46E5"),
                spaceAfter=15
            )
            heading_style = ParagraphStyle(
                'ReportHeading',
                parent=styles['Heading2'],
                fontName='Helvetica-Bold',
                fontSize=13,
                leading=16,
                textColor=colors.HexColor("#1E293B"),
                spaceBefore=12,
                spaceAfter=6
            )
            body_style = ParagraphStyle(
                'ReportBody',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=9,
                leading=13,
                textColor=colors.HexColor("#334155")
            )
            bold_body_style = ParagraphStyle(
                'ReportBoldBody',
                parent=styles['Normal'],
                fontName='Helvetica-Bold',
                fontSize=9,
                leading=13,
                textColor=colors.HexColor("#1E293B")
            )
            header_cell_style = ParagraphStyle(
                'HeaderCell',
                parent=styles['Normal'],
                fontName='Helvetica-Bold',
                fontSize=9,
                leading=11,
                textColor=colors.white
            )
            summary_box_style = ParagraphStyle(
                'SummaryBox',
                parent=styles['Normal'],
                fontName='Helvetica-Oblique',
                fontSize=9.5,
                leading=14.5,
                textColor=colors.HexColor("#1E293B")
            )

            # Divider function
            def add_divider():
                t = Table([[""]], colWidths=[520], rowHeights=[1])
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#E2E8F0")),
                    ("TOPPADDING", (0,0), (-1,-1), 0),
                    ("BOTTOMPADDING", (0,0), (-1,-1), 0),
                ]))
                elements.append(Spacer(1, 8))
                elements.append(t)
                elements.append(Spacer(1, 8))

            # Header
            elements.append(Paragraph("HireReady — Performance Report", title_style))
            target_role = report.category_scores.get("_target_role", "Software Engineer")
            session_type = report.category_scores.get("_session_type", "technical").capitalize()
            difficulty = report.category_scores.get("_difficulty", "Medium")
            elements.append(Paragraph(f"AI Coach Interview Evaluation for {target_role} ({session_type} · {difficulty})", subtitle_style))
            
            # Summary / Overall Score Box
            summary_text = report.session_summary or "Evaluation completed."
            summary_p = Paragraph(f"<b>Executive Summary:</b> {summary_text}", summary_box_style)
            
            score_box_data = [
                [
                    Paragraph(f"<font color='#4F46E5'><b>Overall Score</b></font><br/><font size='32'><b>{report.overall_score:.0f}</b></font><font size='14'>/100</font>", title_style),
                    summary_p
                ]
            ]
            score_box_table = Table(score_box_data, colWidths=[130, 390])
            score_box_table.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
                ("BOX", (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
                ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                ("TOPPADDING", (0,0), (-1,-1), 10),
                ("BOTTOMPADDING", (0,0), (-1,-1), 10),
                ("LEFTPADDING", (0,0), (-1,-1), 12),
                ("RIGHTPADDING", (0,0), (-1,-1), 12),
            ]))
            elements.append(score_box_table)
            
            add_divider()
            
            # Metrics Breakdown Section
            elements.append(Paragraph("Core Skill & Competency Breakdown", heading_style))
            
            cat_data = [[
                Paragraph("Competency Metric", header_cell_style), 
                Paragraph("Score", header_cell_style), 
                Paragraph("Performance Level", header_cell_style)
            ]]
            
            metrics_list = [
                ("Technical Accuracy", report.category_scores.get("technical_accuracy", report.overall_score)),
                ("Communication & Pace", report.category_scores.get("communication", report.overall_score)),
                ("Explanation Depth & Detail", report.category_scores.get("depth", report.overall_score)),
                ("Confidence Level", report.category_scores.get("confidence", report.overall_score)),
            ]
            
            for name, val in metrics_list:
                val = float(val)
                level = "Excellent" if val >= 80 else "Proficient" if val >= 60 else "Developing"
                color_hex = "#10B981" if val >= 80 else "#F59E0B" if val >= 60 else "#EF4444"
                
                cat_data.append([
                    Paragraph(f"<b>{name}</b>", body_style),
                    Paragraph(f"<b>{val:.1f} / 100</b>", bold_body_style),
                    Paragraph(f"<font color='{color_hex}'><b>{level}</b></font>", bold_body_style)
                ])
                
            cat_table = Table(cat_data, colWidths=[240, 120, 160])
            cat_table.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1E293B")),
                ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("TOPPADDING", (0,0), (-1,-1), 6),
                ("BOTTOMPADDING", (0,0), (-1,-1), 6),
                ("LEFTPADDING", (0,0), (-1,-1), 8),
                ("RIGHTPADDING", (0,0), (-1,-1), 8),
            ]))
            elements.append(cat_table)
            
            # Speech & Pace Metrics Sub-table
            elements.append(Spacer(1, 8))
            avg_wpm = report.category_scores.get("avg_wpm", 0)
            total_fillers = report.category_scores.get("total_fillers", 0)
            total_pauses = report.category_scores.get("total_pauses", 0)
            
            voice_text = f"🎙️ <b>Speech Insights:</b>  Pace: <b>{avg_wpm} WPM</b> (Target: 120-150)  |  Filler Words: <b>{total_fillers}</b>  |  Pauses: <b>{total_pauses}</b>"
            elements.append(Paragraph(voice_text, body_style))
            
            add_divider()
            
            # Strengths & Improvements List
            elements.append(Paragraph("Key Strengths & Recommended Enhancements", heading_style))
            
            strength_p_list = []
            improve_p_list = []
            
            for s in report.strengths or ["Demonstrated standard software engineering knowledge."]:
                strength_p_list.append(f"• {s}")
            for imp in report.areas_to_improve or ["Practice articulating answers structured with the STAR method."]:
                improve_p_list.append(f"• {imp}")
                
            strength_box = Paragraph("<font color='#10B981'><b>Identified Strengths:</b></font><br/><br/>" + "<br/><br/>".join(strength_p_list), body_style)
            improve_box = Paragraph("<font color='#EF4444'><b>Areas for Improvement:</b></font><br/><br/>" + "<br/><br/>".join(improve_p_list), body_style)
            
            side_data = [[strength_box, improve_box]]
            side_table = Table(side_data, colWidths=[255, 255])
            side_table.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (0,0), colors.HexColor("#ECFDF5")),
                ("BACKGROUND", (1,0), (1,0), colors.HexColor("#FEF2F2")),
                ("BOX", (0,0), (0,0), 1, colors.HexColor("#A7F3D0")),
                ("BOX", (1,0), (1,0), 1, colors.HexColor("#FCA5A5")),
                ("VALIGN", (0,0), (-1,-1), "TOP"),
                ("TOPPADDING", (0,0), (-1,-1), 10),
                ("BOTTOMPADDING", (0,0), (-1,-1), 10),
                ("LEFTPADDING", (0,0), (-1,-1), 10),
                ("RIGHTPADDING", (0,0), (-1,-1), 10),
            ]))
            elements.append(side_table)
            
            # Clean Pagebreak for question breakdown table
            elements.append(PageBreak())
            
            # Detailed Q&A Feedback Section
            elements.append(Paragraph("Detailed Question Breakdown & AI Feedback", title_style))
            elements.append(Spacer(1, 10))
            
            q_data = [[
                Paragraph("Question Prompt", header_cell_style), 
                Paragraph("Score", header_cell_style), 
                Paragraph("Detailed Response & AI Feedback", header_cell_style)
            ]]
            
            for i, a in enumerate(answers):
                q_p = Paragraph(f"<b>Q{i+1}:</b> {a.question_text}", body_style)
                ans_text = a.answer_text or "No answer recorded."
                feedback_str = f"<b>Your Answer:</b> <i>\"{ans_text}\"</i><br/><br/><b>AI Feedback:</b> {a.feedback or 'No feedback recorded.'}"
                feedback_p = Paragraph(feedback_str, body_style)
                
                score_val = float(a.score or 0.0)
                score_color = "#10B981" if score_val >= 80.0 else "#F59E0B" if score_val >= 60.0 else "#EF4444"
                
                q_data.append([
                    q_p,
                    Paragraph(f"<font color='{score_color}'><b>{score_val:.0f}/100</b></font>", bold_body_style),
                    feedback_p
                ])
                
            q_table = Table(q_data, colWidths=[150, 50, 320])
            q_table.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1E293B")),
                ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("VALIGN", (0,0), (-1,-1), "TOP"),
                ("TOPPADDING", (0,0), (-1,-1), 8),
                ("BOTTOMPADDING", (0,0), (-1,-1), 8),
                ("LEFTPADDING", (0,0), (-1,-1), 6),
                ("RIGHTPADDING", (0,0), (-1,-1), 6),
            ]))
            elements.append(q_table)
            
            # ── 4-Week Personalized Skill Roadmap (Page 3 / Final Section) ────
            elements.append(PageBreak())
            elements.append(Paragraph("Personalized 4-Week Skill Mastery Roadmap", title_style))
            elements.append(Paragraph("A custom 4-week study plan generated by AI to eliminate your competency gaps.", subtitle_style))
            elements.append(Spacer(1, 10))

            missing_skills = report.missing_skills or []
            if not missing_skills:
                missing_skills = ["Advanced Architecture", "System Scaling", "Performance Optimization"]
                
            skills_to_learn = list(missing_skills)
            generic_skills = ["System Design", "Communication", "Leadership", "Debugging", "Code Review"]
            while len(skills_to_learn) < 4:
                for gs in generic_skills:
                    if gs not in skills_to_learn:
                        skills_to_learn.append(gs)
                        break

            roadmap_data = [[
                Paragraph("Timeline", header_cell_style),
                Paragraph("Focus Area & Mastery Goal", header_cell_style),
                Paragraph("Structured Daily Topics & Action Items", header_cell_style)
            ]]

            weeks = [
                ("Week 1\n(Days 1-7)", f"Mastering {skills_to_learn[0]} Fundamentals", [
                    "Day 1-2: Core theoretical foundations, interview syntax, and pattern recognition.",
                    "Day 3-4: Build three functional exercises / algorithms on your local environment.",
                    "Day 5-7: Solve 5 target mock-questions and practice speaking answers clearly."
                ]),
                ("Week 2\n(Days 8-14)", f"Deep Dive: {skills_to_learn[1]} Integration", [
                    "Day 8-9: Advanced concepts, edge cases, and state management review.",
                    "Day 10-12: Create a complete miniature modular production component utilizing standard practices.",
                    "Day 13-14: Practice answering architecture questions using the STAR framework."
                ]),
                ("Week 3\n(Days 15-21)", f"{skills_to_learn[2]} & Distributed Architectures", [
                    "Day 15-16: Integrating third-party components and caching/database layers.",
                    "Day 17-18: System design scaling patterns, performance bottleneck analysis.",
                    "Day 19-21: Simulated code reviews and high-level structural delivery exercise."
                ]),
                ("Week 4\n(Days 22-28)", f"Polish & Full Mock Interviews", [
                    f"Day 22-23: Final polish of {skills_to_learn[3]} and behavioral review.",
                    "Day 24-25: Run two simulated mock interviews on HireReady.",
                    "Day 26-28: Calibrate speaking speed (WPM), eliminate filler words, and review feedback logs."
                ])
            ]

            for week_num, focus, items in weeks:
                week_p = Paragraph(f"<b>{week_num}</b>", bold_body_style)
                focus_p = Paragraph(f"<b>{focus}</b><br/><font color='#4F46E5'>Focus Level: Intensive</font>", body_style)
                
                items_html = "".join([f"• {item}<br/>" for item in items])
                items_p = Paragraph(items_html, body_style)
                
                roadmap_data.append([week_p, focus_p, items_p])

            roadmap_table = Table(roadmap_data, colWidths=[60, 160, 300])
            roadmap_table.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1E293B")),
                ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("VALIGN", (0,0), (-1,-1), "TOP"),
                ("TOPPADDING", (0,0), (-1,-1), 10),
                ("BOTTOMPADDING", (0,0), (-1,-1), 10),
                ("LEFTPADDING", (0,0), (-1,-1), 8),
                ("RIGHTPADDING", (0,0), (-1,-1), 8),
            ]))
            elements.append(roadmap_table)

            # Recommended Resources Section if present
            if report.recommended_resources:
                elements.append(Spacer(1, 14))
                elements.append(Paragraph("Contextual Learning Resources & Roadmaps", heading_style))
                res_data = [[
                    Paragraph("Target Skill", header_cell_style),
                    Paragraph("Recommended Resource Link", header_cell_style),
                    Paragraph("Resource Type", header_cell_style)
                ]]
                for res in report.recommended_resources:
                    res_data.append([
                        Paragraph(f"<b>{res.get('skill', '')}</b>", body_style),
                        Paragraph(f"<a href='{res.get('link', '')}' color='#4F46E5'><u>{res.get('link', '')}</u></a>", body_style),
                        Paragraph(res.get('type', 'docs').upper(), bold_body_style)
                    ])
                res_table = Table(res_data, colWidths=[120, 280, 120])
                res_table.setStyle(TableStyle([
                    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#4F46E5")),
                    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                    ("TOPPADDING", (0,0), (-1,-1), 6),
                    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
                    ("LEFTPADDING", (0,0), (-1,-1), 8),
                    ("RIGHTPADDING", (0,0), (-1,-1), 8),
                ]))
                elements.append(res_table)
                
            doc.build(elements)
            return f"/uploads/{pdf_filename}"
        except Exception as e:
            print(f"[ERROR] PDF Generation failed: {e}")
            import traceback
            traceback.print_exc()
            return None


def _build_resources(skills: list, role: str) -> list:
    """Generate contextual learning resources based on missing skills."""
    RESOURCE_MAP = {
        "PyTorch":             {"link": "https://pytorch.org/tutorials/", "type": "docs"},
        "Scikit-Learn":        {"link": "https://scikit-learn.org/stable/tutorial/", "type": "docs"},
        "React":               {"link": "https://react.dev/learn", "type": "docs"},
        "TypeScript":          {"link": "https://www.typescriptlang.org/docs/", "type": "docs"},
        "Docker":              {"link": "https://docs.docker.com/get-started/", "type": "docs"},
        "Kubernetes":          {"link": "https://kubernetes.io/docs/tutorials/", "type": "docs"},
        "FastAPI":             {"link": "https://fastapi.tiangolo.com/tutorial/", "type": "docs"},
        "PostgreSQL":          {"link": "https://www.postgresqltutorial.com/", "type": "tutorial"},
        "Kafka":               {"link": "https://kafka.apache.org/quickstart", "type": "docs"},
        "System Design":       {"link": "https://github.com/donnemartin/system-design-primer", "type": "github"},
        "Microservices":       {"link": "https://microservices.io/patterns/", "type": "article"},
        "Feature Engineering": {"link": "https://www.kaggle.com/learn/feature-engineering", "type": "course"},
        "Model Deployment":    {"link": "https://mlflow.org/docs/latest/", "type": "docs"},
        "SQL":                 {"link": "https://sqlzoo.net/", "type": "tutorial"},
        "Pandas":              {"link": "https://pandas.pydata.org/docs/getting_started/", "type": "docs"},
    }
    resources = []
    for skill in skills[:5]:
        if skill in RESOURCE_MAP:
            resources.append({"skill": skill, **RESOURCE_MAP[skill]})
        else:
            resources.append({
                "skill": skill,
                "link": f"https://www.google.com/search?q={skill.replace(' ', '+')}+interview+questions",
                "type": "search"
            })
    return resources
