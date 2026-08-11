-- Seed careers
insert into careers (title, description, demand_indicator, salary_min, salary_max, salary_currency) values
  ('Software Engineer', 'Design, develop, and maintain software applications across various domains including web, mobile, and backend systems. Work with modern frameworks and tools to build scalable solutions.', 'High', 85000, 160000, 'USD'),
  ('Data Scientist', 'Analyze large datasets to extract insights, build predictive models, and support data-driven decision making. Work with Python, R, machine learning frameworks, and statistical methods.', 'High', 90000, 155000, 'USD'),
  ('UX Designer', 'Create user-centered designs through research, wireframing, prototyping, and usability testing. Collaborate with product and engineering teams to deliver intuitive digital experiences.', 'Medium', 75000, 130000, 'USD'),
  ('DevOps Engineer', 'Bridge development and operations by automating deployments, managing CI/CD pipelines, and maintaining cloud infrastructure. Expert in Docker, Kubernetes, and cloud platforms.', 'High', 95000, 165000, 'USD'),
  ('Cybersecurity Analyst', 'Protect organizational systems and data by monitoring threats, conducting vulnerability assessments, and implementing security measures. Work with SIEM tools and incident response.', 'High', 80000, 145000, 'USD'),
  ('Product Manager', 'Define product vision, prioritize features, and coordinate cross-functional teams to deliver products that meet user needs and business objectives. Bridge technical and business worlds.', 'Medium', 90000, 160000, 'USD'),
  ('AI/ML Engineer', 'Build and deploy machine learning models and AI systems at scale. Work on model training, optimization, MLOps pipelines, and integrating AI capabilities into production applications.', 'High', 110000, 185000, 'USD'),
  ('Full Stack Developer', 'Build complete web applications from frontend interfaces to backend APIs and databases. Proficient in both client-side and server-side technologies across the full development stack.', 'High', 80000, 150000, 'USD'),
  ('Registered Nurse', 'Provide direct patient care, administer treatments, and coordinate with physicians in hospitals, clinics, and community health settings. Requires strong clinical judgment and compassion.', 'High', 65000, 105000, 'USD'),
  ('Financial Analyst', 'Evaluate financial data, build models, and advise on investment decisions, budgeting, and forecasting for businesses or individual clients. Strong grounding in accounting and markets.', 'Medium', 65000, 120000, 'USD'),
  ('Mechanical Engineer', 'Design, analyze, and test mechanical systems and devices, from consumer products to industrial machinery. Combines physics, materials science, and CAD tooling.', 'Medium', 70000, 125000, 'USD'),
  ('Elementary School Teacher', 'Plan and deliver lessons, assess student progress, and foster a supportive classroom environment for young learners. Requires strong communication and patience.', 'Medium', 45000, 70000, 'USD'),
  ('Marketing Manager', 'Develop and execute marketing strategy across digital and traditional channels, manage campaigns, and analyze performance to grow brand awareness and revenue.', 'Medium', 65000, 130000, 'USD'),
  ('Civil Engineer', 'Plan, design, and oversee construction of infrastructure such as roads, bridges, and buildings, ensuring safety and regulatory compliance.', 'Medium', 68000, 120000, 'USD'),
  ('Graphic Designer', 'Create visual concepts for branding, marketing materials, and digital media using design software, balancing creativity with client and business goals.', 'Medium', 45000, 85000, 'USD'),
  ('Human Resources Manager', 'Oversee recruitment, employee relations, compensation, and workplace policy to support organizational culture and compliance.', 'Medium', 60000, 115000, 'USD'),
  ('Environmental Scientist', 'Study ecosystems, assess environmental impact, and develop strategies for sustainability and regulatory compliance across industries.', 'Medium', 55000, 100000, 'USD'),
  ('Physical Therapist', 'Diagnose and treat movement dysfunction, helping patients recover from injury or manage chronic conditions through hands-on therapy and exercise plans.', 'High', 75000, 110000, 'USD'),
  ('Chef / Culinary Professional', 'Design menus, manage kitchen operations, and prepare dishes in restaurants, hotels, or catering businesses, blending creativity with operational discipline.', 'Medium', 40000, 90000, 'USD'),
  ('Lawyer', 'Advise clients and represent them in legal matters, ranging from corporate transactions to litigation, requiring rigorous research and argumentation skills.', 'Medium', 75000, 190000, 'USD'),
  ('Architect', 'Design buildings and spaces that balance aesthetics, function, and safety, working closely with clients, engineers, and construction teams.', 'Medium', 65000, 130000, 'USD'),
  ('Social Worker', 'Support individuals and families facing hardship by connecting them with resources, counseling, and advocacy within community or clinical settings.', 'Medium', 45000, 75000, 'USD'),
  ('Supply Chain Manager', 'Coordinate procurement, logistics, and inventory to ensure efficient flow of goods from suppliers to customers, optimizing cost and reliability.', 'Medium', 65000, 125000, 'USD');

-- Seed assessment questions
insert into assessment_questions (question, type, options, position) values
  ('What type of work excites you most?', 'single_choice', '["Building and creating new things", "Analyzing data to find patterns", "Designing intuitive user experiences", "Solving security and infrastructure challenges"]', 0),
  ('Which subjects do you enjoy most?', 'multi_choice', '["Mathematics and Statistics", "Computer Science and Programming", "Design and Visual Arts", "Psychology and Human Behavior", "Business and Strategy"]', 1),
  ('How comfortable are you with programming?', 'scale', '["Complete beginner", "Some basics", "Intermediate", "Advanced", "Expert"]', 2),
  ('What is your preferred working style?', 'single_choice', '["Working independently on deep technical problems", "Collaborating closely with a team", "A mix of solo and team work", "Leading and coordinating others"]', 3),
  ('Which best describes your career goal?', 'single_choice', '["High salary and financial stability", "Making a creative impact", "Solving challenging technical problems", "Building products people love", "Advancing cutting-edge technology"]', 4),
  ('How do you feel about working with data?', 'scale', '["Dislike it", "Neutral", "Enjoy basic analysis", "Love working with data", "Passionate about data science"]', 5),
  ('What size company would you prefer?', 'single_choice', '["Startup (1-50 people)", "Mid-size company (50-500)", "Large corporation (500+)", "Remote/freelance", "No preference"]', 6),
  ('Which technical area interests you most?', 'single_choice', '["Frontend web development", "Backend systems and APIs", "Machine learning and AI", "Security and networking", "Cloud and infrastructure", "Mobile development"]', 7),
  ('How important is work-life balance to you?', 'scale', '["Not important - I want to go all in", "Somewhat important", "Moderately important", "Very important", "Critical - it is my top priority"]', 8),
  ('What best describes your problem-solving approach?', 'single_choice', '["Systematic and methodical - I follow a process", "Creative and experimental - I try new things", "Collaborative - I prefer to think with others", "Research-driven - I study before acting"]', 9);
