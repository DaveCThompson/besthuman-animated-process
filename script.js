document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(MotionPathPlugin);

    // ==========================================================================
    // 1. CONFIGURATION & STATE MANAGEMENT
    // ==========================================================================

    const config = {
        contentFadeDuration: 0.3,
        rotationSpeed: 60,
        tracerSpeed: 0.4,
        fadeDuration: 0.4,
    };

    let state = {
        activeIndex: -1,
        isAnimating: false,
    };

    let rotationTween;

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

    // ==========================================================================
    // 2. DOM ELEMENT SELECTION
    // ==========================================================================

    const nodeMap = [];
    const totalNodes = 5;
    for (let i = 0; i < totalNodes; i++) {
        const index = i + 1;
        const zeroBasedIndex = i;
        const outerNodeGroup = document.querySelector(`.outer-node-group[data-index="${zeroBasedIndex}"]`);
        nodeMap.push({
            line: document.querySelector(`.connecting_line-${index}`),
            ringNode: document.querySelector(`.on_ring_node-${index}`),
            outerNodeGroup: outerNodeGroup,
            clickableElements: [
                document.querySelector(`.on_ring_node-${index}`),
                outerNodeGroup
            ]
        });
    }

    const contentTitle = document.getElementById('content-title');
    const contentDescription = document.getElementById('content-description');
    const tracerDot = document.getElementById('tracer-dot');
    const centralHub = document.getElementById('central-hub');
    const processContainer = document.getElementById('process-container');

    // ==========================================================================
    // 3. DATA
    // ==========================================================================

    const contentData = [
        { title: "1. Discovery", description: "We begin with a simple, honest conversation to understand your goals and challenges. No hard sell, just a genuine exploration to see if we’re the right partner for you." },
        { title: "2. Co-Design", description: "If we're a fit, we'll co-design a bespoke program tailored to your unique context. We map out key objectives and define what measurable success looks like." },
        { title: "3. Delivery", description: "We roll out the program, focusing on engaging, interactive sessions that drive real behavioral change. Our dedicated success partner handles all logistics." },
        { title: "4. Impact Report", description: "We believe in transformation you can see. We gather feedback and deliver a clear Impact Report, showing progress against our shared KPIs and identifying wins." },
        { title: "5. Follow Up", description: "Our partnership doesn’t end with the program. We schedule follow-up sessions to ensure the learning is embedded, not forgotten, and adjust for continuous growth." }
    ];
    const restContent = { title: "The Collaborative Process", description: "A high-touch journey from initial challenge to lasting impact. Click a step to learn more." };

    // ==========================================================================
    // 4. CORE FUNCTIONS & LOGIC
    // ==========================================================================

    function goToState(targetIndex) {
        const previousIndex = state.activeIndex;
        if (targetIndex === previousIndex || state.isAnimating) return;
        
        state.isAnimating = true;

        // Deactivate previous node
        if (previousIndex !== -1) {
            const oldNode = nodeMap[previousIndex];
            oldNode.line.classList.remove('active');
            oldNode.ringNode.classList.remove('active');
            oldNode.outerNodeGroup.classList.remove('active');
        }
        
        const path = document.querySelector(`.inter-node-path[data-from="${previousIndex}"][data-to="${targetIndex}"]`);
        
        const tl = gsap.timeline({
            onComplete: () => {
                state.isAnimating = false;
                state.activeIndex = targetIndex;
            }
        });

        if (path) {
            const pathLength = path.getTotalLength();
            
            tl.set(path, { opacity: 1, strokeDasharray: pathLength, strokeDashoffset: pathLength })
              .set(tracerDot, { opacity: 1 })
              .to(path, { strokeDashoffset: 0, duration: config.tracerSpeed, ease: 'power1.inOut' })
              .to(tracerDot, { motionPath: { path: path, align: path, alignOrigin: [0.5, 0.5] }, duration: config.tracerSpeed, ease: 'power1.inOut' }, "<");

            if (targetIndex !== -1) {
                const newNode = nodeMap[targetIndex];
                tl.add(() => {
                    newNode.line.classList.add('active');
                    newNode.ringNode.classList.add('active');
                    newNode.outerNodeGroup.classList.add('active');
                });
            }

            tl.to(tracerDot, { opacity: 0, duration: 0.2 }, ">")
              .to(path, { opacity: 0, duration: config.fadeDuration, ease: 'power1.out' }, "<");

        } else { // Direct activation, no path animation (e.g., initial state)
            if (targetIndex !== -1) {
                const newNode = nodeMap[targetIndex];
                newNode.line.classList.add('active');
                newNode.ringNode.classList.add('active');
                newNode.outerNodeGroup.classList.add('active');
            }
            state.isAnimating = false;
            state.activeIndex = targetIndex;
        }

        updateContentPanel(targetIndex);
    }

    function updateContentPanel(index) {
        const content = (index === -1) ? restContent : contentData[index];
        const wrapper = document.querySelector('.content-wrapper');
        
        gsap.to(wrapper, {
            opacity: 0, y: 10, duration: config.contentFadeDuration, ease: 'power1.in',
            onComplete: () => {
                contentTitle.textContent = content.title;
                contentDescription.textContent = content.description;
                gsap.fromTo(wrapper, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: config.contentFadeDuration, ease: 'power1.out' });
            }
        });
    }
    
    // ==========================================================================
    // 5. EVENT LISTENERS & INITIALIZATION
    // ==========================================================================

    nodeMap.forEach((node) => {
        // Click/Tap listeners
        node.clickableElements.forEach(element => {
            if (element) {
                element.addEventListener('click', () => {
                    const targetIndex = parseInt(element.dataset.index, 10);
                    goToState(targetIndex);
                });
            }
        });
        
        // Keyboard listeners
        if (node.outerNodeGroup) {
            node.outerNodeGroup.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const targetIndex = parseInt(node.outerNodeGroup.dataset.index, 10);
                    goToState(targetIndex);
                }
            });
        }
    });

    // --- Central Hub Hover Animations (Desktop only) ---
    if (canHover.matches) {
        centralHub.addEventListener('mouseenter', () => {
            processContainer.classList.add('hub-hover');
            gsap.to(rotationTween, { timeScale: 4, duration: 0.8, ease: 'power2.out' });
            nodeMap.forEach(node => {
                if (node.hoverTranslate) {
                    gsap.to(node.outerNodeGroup, { x: node.hoverTranslate.x, y: node.hoverTranslate.y, duration: 1.2, ease: 'elastic.out(1, 0.6)' });
                }
            });
        });
        centralHub.addEventListener('mouseleave', () => {
            processContainer.classList.remove('hub-hover');
            gsap.to(rotationTween, { timeScale: 1, duration: 0.8, ease: 'power2.out' });
            nodeMap.forEach(node => {
                gsap.to(node.outerNodeGroup, { x: 0, y: 0, duration: 1.0, ease: 'elastic.out(1, 0.6)' });
            });
        });
    }

    function initialize() {
        gsap.set(tracerDot, { opacity: 0 });
        gsap.from(".main-container", { opacity: 0, duration: 0.8, ease: 'power2.out' });
        
        // --- Ambient Animations ---
        const rotatingGroup = document.querySelector(".rotating-group");
        let rotationProxy = { angle: 0 }; 
        rotationTween = gsap.to(rotationProxy, {
            angle: 360, duration: config.rotationSpeed, ease: "none", repeat: -1,
            onUpdate: () => rotatingGroup.setAttribute('transform', `translate(110 146) rotate(${rotationProxy.angle})`)
        });
        gsap.to(centralHub, { scale: 1.02, duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true });

        // --- Pre-calculate hover vectors for hub animation ---
        if (canHover.matches) {
            const hubCenter = { x: 110, y: 146 };
            const moveDistance = 6;
            nodeMap.forEach(node => {
                const bbox = node.outerNodeGroup.getBBox();
                const nodeCenter = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
                const vecX = hubCenter.x - nodeCenter.x;
                const vecY = hubCenter.y - nodeCenter.y;
                const magnitude = Math.sqrt(vecX * vecX + vecY * vecY);
                node.hoverTranslate = {
                    x: (vecX / magnitude) * moveDistance,
                    y: (vecY / magnitude) * moveDistance,
                };
            });
        }
        
        // --- Start the interaction ---
        goToState(0);
    }

    initialize();
});