import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Mobile device detection
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window) ||
        (window.innerWidth <= 768);
};

// Camera sensitivity constants
const SENSITIVITY = {
    PC: 0.005,      // Default sensitivity for PC
    MOBILE: 0.005   // Higher sensitivity for mobile
};

// Movement and zoom speed constants
const MOVEMENT_SPEED = {
    PC: 8,          // Default movement speed for PC
    MOBILE: 5       // Slower movement speed for mobile
};

const ZOOM_SPEED = {
    PC: 0.6,        // Default zoom speed for PC
    MOBILE: 0.4     // Slower zoom speed for mobile
};

export const CameraMovement = ({ 
    gizmoActive, 
    disableMovement, 
    mode, 
    cameraTarget, 
    GROUND_LEVEL, 
    wallBoxes, 
    spawnPositions, 
    spawnRotations,
    cameraLookAtTarget,
    imageLerpFlag,
    mobileInput = { move: { x: 0, y: 0 } },
    tourMode = false,
    tourPlaying = false,
    onTourInterrupted,
    onCameraMovement
}) => {
    const { camera, gl } = useThree();
    useEffect(() => {
        const el = gl.domElement;
        
        // Disable iOS system gestures while touching WebGL canvas
        el.style.touchAction = 'none';
        el.style.webkitUserSelect = 'none';
        el.style.webkitTouchCallout = 'none';
        el.style.userSelect = 'none';
        
        // Prevent Safari "rubber band" scroll
        const preventBounce = (e) => {
            if (e.cancelable) e.preventDefault();
        };
        window.addEventListener('touchmove', preventBounce, { passive: false });

        return () => {
            window.removeEventListener('touchmove', preventBounce);
        };
    }, [gl]);

    useEffect(() => {
        const preventNavigationGesture = (e) => {
            const touch = e.touches[0];
            if (touch && (touch.clientX < 30 || touch.clientY < 30)) {
            if (e.cancelable) e.preventDefault();
            }
        };
        window.addEventListener('touchstart', preventNavigationGesture, { passive: true });
        return () => window.removeEventListener('touchstart', preventNavigationGesture);
    }, []);

    const pressedKeys = useRef(new Set());
    const CAMERA_RADIUS = 1;
    const isPointerDown = useRef(false);
    const lastPointer = useRef({ x: 30, y: 0 });
    const yaw = useRef(0);
    const pitch = useRef(0);
    const prevMode = useRef(mode);
    const initializedRef = useRef(false);
    const [isAtImageTarget, setIsAtImageTarget] = useState(false);
    const lastTargetPos = useRef(null);
    const lastTargetQuat = useRef(null);

    const targetBlockedRef = useRef(false);

    // Mobile input refs
    const mobileMove = useRef({ x: 0, y: 0 });
    
    // Detect mobile device and set appropriate sensitivity
    const isMobile = isMobileDevice();
    const cameraSensitivity = isMobile ? SENSITIVITY.MOBILE : SENSITIVITY.PC;
    const moveSpeed = isMobile ? MOVEMENT_SPEED.MOBILE : MOVEMENT_SPEED.PC;
    const zoomSpeed = isMobile ? ZOOM_SPEED.MOBILE : ZOOM_SPEED.PC;

    const dirRef = useRef(new THREE.Vector3());
    const rightRef = useRef(new THREE.Vector3());
    const rotationTouchId = useRef(null);

    // Listen for image lerp trigger
    useEffect(() => {
        setIsAtImageTarget(false);
    }, [imageLerpFlag]);

    useEffect(() => {
        const panel = document.getElementById('image-info-panel');
        const btn = document.getElementById('panel-toggle-btn');
        if (!panel || !btn) return;

        // Helper to toggle panel
        const togglePanel = () => {
            if (panel.style.display === 'flex') {
                panel.style.display = 'none';
                btn.textContent = 'Show Info';
            } else {
                panel.style.display = 'flex';
                btn.textContent = 'Hide Info';
            }
        }

        btn.onclick = togglePanel;

        if (isAtImageTarget) {
            btn.style.display = 'block';
            panel.style.display = 'none';
            btn.textContent = 'Show Info';
        } else {
            btn.style.display = 'none';
            panel.style.display = 'none';
        }

        // Cleanup
        return () => { btn.onclick = null; };
        
    }, [isAtImageTarget]);

    // Initialize yaw/pitch from camera
    useEffect(() => {
        if (spawnPositions.length > 0 && !initializedRef.current) {
            // Đặt vị trí camera
            camera.position.set(
            spawnPositions[0][0],
            GROUND_LEVEL,
            spawnPositions[0][2]
            );

            const rot = spawnRotations[0] || [0, 0, 0];

            // Tạo Euler từ spawn rotation
            const eulerSpawn = new THREE.Euler(
            THREE.MathUtils.degToRad(rot[0]),
            THREE.MathUtils.degToRad(rot[1]),
            THREE.MathUtils.degToRad(rot[2]),
            "YXZ"
            );

            // Convert qua quaternion để chuẩn hóa
            const quatSpawn = new THREE.Quaternion().setFromEuler(eulerSpawn);

            // Convert lại Euler (YXZ) để tách yaw/pitch đúng
            const euler = new THREE.Euler().setFromQuaternion(quatSpawn, "YXZ");

            // Lấy yaw/pitch
            yaw.current = euler.y;
            pitch.current = (mode === "view") ? 0 : euler.x;

            // Áp quaternion ban đầu cho camera
            camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, "YXZ"));

            initializedRef.current = true;
        }
        }, [camera, GROUND_LEVEL, spawnPositions, spawnRotations, mode]);


    // Update mobile input values
    useEffect(() => {
        mobileMove.current = mobileInput.move || { x: 0, y: 0 };
    }, [mobileInput]);

    // Track previous tour mode state to detect when tour mode ends
    const prevTourMode = useRef(tourMode);
    
    // Update yaw/pitch when tour mode ends to preserve camera orientation
    useEffect(() => {
        if (prevTourMode.current && !tourMode) {
            // Tour mode just ended - preserve current camera orientation
            const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
            yaw.current = euler.y;
            pitch.current = euler.x;
        }
        prevTourMode.current = tourMode;
    }, [tourMode, camera]);

    // Mouse drag to rotate camera
    useEffect(() => {
        const handlePointerDown = (e) => {
            // Nếu chạm trong vùng joystick thì bỏ qua (để joystick xử lý)
            const joystickEl = document.querySelector('.mobile-joystick');
            if (joystickEl) {
                const rect = joystickEl.getBoundingClientRect();
                if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
                ) {
                return; // bỏ qua nếu nằm trong joystick
                }
            }

            // Nếu không chạm trong joystick thì cho phép camera xoay
            rotationTouchId.current = e.pointerId;
            isPointerDown.current = true;
            lastPointer.current = { x: e.clientX, y: e.clientY };
        };

        const handlePointerUp = (e) => {
            if (e.pointerId === rotationTouchId.current) {
            isPointerDown.current = false;
            rotationTouchId.current = null;
            }
        };
        const handlePointerMove = (e) => {
            if (!isPointerDown.current || e.pointerId !== rotationTouchId.current) return;
            if (gizmoActive.current || disableMovement) return;

            const now = performance.now();
            if (handlePointerMove.lastTime && now - handlePointerMove.lastTime < 16) return; // ~60fps
            handlePointerMove.lastTime = now;

            const dx = e.clientX - lastPointer.current.x;
            const dy = e.clientY - lastPointer.current.y;
            lastPointer.current = { x: e.clientX, y: e.clientY };

            yaw.current -= dx * cameraSensitivity;
            if (mode === 'edit') {
                pitch.current -= dy * cameraSensitivity;
                pitch.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch.current));
            }

            // Cancel target when user starts rotating camera (but not during tour mode)
            if (cameraTarget.current && !tourMode) {
                cameraTarget.current = null;
                cameraLookAtTarget.current = null;
                setIsAtImageTarget(false);

                // Sync yaw/pitch with current camera rotation to prevent snapping
                const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
                yaw.current = euler.y;
                if (mode === 'edit') {
                    pitch.current = euler.x;
                }
            }

            onCameraMovement?.();
        };
        
        gl.domElement.addEventListener("pointerdown", handlePointerDown);
        gl.domElement.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            gl.domElement.removeEventListener("pointerdown", handlePointerDown);
            gl.domElement.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [gl, mode, tourMode, tourPlaying, onTourInterrupted, onCameraMovement]);

    // Camera movement
    useEffect(() => {
        const handleKeyDown = (event) => {
            pressedKeys.current.add(event.code);

            // Interrupt tour mode if user moves
            if (tourMode && tourPlaying && onTourInterrupted && 
                ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
                onTourInterrupted();
            }
            
            // Hide info button if not in tour mode and user moves
            if (!tourMode && onCameraMovement && 
                ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
                onCameraMovement();
            }

            // Cancel target when user starts moving (but not during tour mode)
            if (cameraTarget.current && !tourMode) {
                cameraTarget.current = null;
                cameraLookAtTarget.current = null;
                setIsAtImageTarget(false);

                const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
                yaw.current = euler.y;
                pitch.current = euler.x; 
            }
        };

        const handleKeyUp = (event) => {
            pressedKeys.current.delete(event.code);
        };
    
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [tourMode, tourPlaying, onTourInterrupted, onCameraMovement]);

    // Scroll wheel to zoom (move camera forward/backward)
    useEffect(() => {
        const handleWheel = (e) => {
            // Interrupt tour mode if user scrolls
            if (tourMode && tourPlaying && onTourInterrupted) {
                onTourInterrupted();
            }
            
            // Hide info button if not in tour mode
            if (!tourMode && onCameraMovement) {
                onCameraMovement();
            }
            
            if (cameraTarget.current && !tourMode) {
                cameraTarget.current = null;
                cameraLookAtTarget.current = null;
                setIsAtImageTarget(false);

                const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
                yaw.current = euler.y;
                pitch.current = euler.x; 
            }
            e.preventDefault();
            // Get camera forward direction
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            // Use device-specific zoom speed
            // const zoomSpeed = 0.6;
            // Calculate next position
            const nextPos = camera.position.clone().addScaledVector(direction, -e.deltaY * 0.01 * zoomSpeed);

            if (mode === 'view') {
                nextPos.y = GROUND_LEVEL;
                // Use continuous collision detection to prevent tunneling
                if (tourMode) {
                    camera.position.copy(nextPos);
                } else {
                    const safePos = moveWithCollisionDetection(camera.position, nextPos, wallBoxes, 0.5);
                    camera.position.copy(safePos);
                }
            } else {
                // Edit mode: allow free vertical movement
                camera.position.copy(nextPos);
            }
        };
        gl.domElement.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            gl.domElement.removeEventListener('wheel', handleWheel);
        };
    }, [gl, mode, wallBoxes, tourMode, tourPlaying, onTourInterrupted, onCameraMovement]);

    // When switching from edit to view mode, push camera out of wall if inside (skip during tour mode)
    useEffect(() => {
        if (prevMode.current === 'edit' && mode === 'view' && !tourMode) {
            let iterations = 0;
            const maxIterations = 30;
            let moved = false;
            do {
                let collidingBox = null;
                for (let [, box] of wallBoxes) {
                    if (box.intersectsBox(
                        new THREE.Box3().setFromCenterAndSize(
                        camera.position.clone(),
                        new THREE.Vector3(0.8, 1.7, 0.8) // hitbox nhân vật
                        )
                    )) {
                        collidingBox = box;
                        break;
                    }
                }
                if (collidingBox) {
                    moved = true;
                    // Move away from the center of the wall box
                    const boxCenter = collidingBox.getCenter(new THREE.Vector3());
                    const direction = camera.position.clone().sub(boxCenter).setY(0).normalize();
                    if (direction.lengthSq() === 0) {
                        // If exactly at the center, push along X
                        direction.set(1, 0, 0);
                    }
                    // Move outwards by a step (wall half size + camera radius + margin)
                    const boxSize = collidingBox.getSize(new THREE.Vector3());
                    const maxHalf = Math.max(boxSize.x, boxSize.z) / 2;
                    camera.position.copy(
                        boxCenter.clone().add(direction.multiplyScalar(maxHalf + CAMERA_RADIUS + 0.05))
                    );
                    camera.position.y = GROUND_LEVEL;
                } else {
                    moved = false;
                }
                iterations++;
            } while (moved && iterations < maxIterations);
        }
        prevMode.current = mode;
    }, [mode, wallBoxes, camera, GROUND_LEVEL, tourMode]);

    useFrame((_, delta) => {
        if (gizmoActive.current || disableMovement) return;

        let isMovingToTarget = false;

        if (mode === 'view' && cameraTarget.current && cameraLookAtTarget?.current) {
            isMovingToTarget = true;

            const target = cameraTarget.current;

            // Lerp position
            const nextPos = camera.position.clone().lerp(
                new THREE.Vector3(target.x, target.y, target.z),
                0.04
            );

            // Skip collision checking during tour mode
            if (!tourMode) {
                const safePos = moveWithCollisionDetection(camera.position, nextPos, wallBoxes, 0.5);
                if (safePos.equals(camera.position)) {
                    // Movement was blocked
                    cameraTarget.current = null;
                    cameraLookAtTarget.current = null;
                    setIsAtImageTarget(false);
                    targetBlockedRef.current = true;

                    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
                    yaw.current = euler.y;
                    pitch.current = 0;
                    return;
                }
                camera.position.copy(safePos);
            } else {
                camera.position.copy(nextPos);
            }

            // Lerp rotation (only y)
            const lookAtPos = cameraLookAtTarget.current;

            const flatTarget = lookAtPos.clone();
            flatTarget.y = camera.position.y;

            const desiredQuat = new THREE.Quaternion();
            const m = new THREE.Matrix4().lookAt(camera.position, flatTarget, new THREE.Vector3(0, 1, 0));
            desiredQuat.setFromRotationMatrix(m);

            camera.quaternion.slerp(desiredQuat, 0.05);

            // if near the target
            if (camera.position.distanceTo(new THREE.Vector3(target.x, target.y, target.z)) < 0.005
                && camera.quaternion.angleTo(desiredQuat) < 0.005) {

                camera.position.set(target.x, target.y, target.z);
                camera.quaternion.copy(desiredQuat);

                cameraTarget.current = null;
                cameraLookAtTarget.current = null;

                setIsAtImageTarget(true);
                lastTargetPos.current = camera.position.clone();
                lastTargetQuat.current = camera.quaternion.clone();

                const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
                yaw.current = euler.y;
            }
        } else {
            if (isAtImageTarget && lastTargetPos.current && lastTargetQuat.current) {
                const posDelta = camera.position.distanceTo(lastTargetPos.current);
                const quatDelta = camera.quaternion.angleTo(lastTargetQuat.current);
                if (posDelta > 0.01 || quatDelta > 0.01) setIsAtImageTarget(false);
            }

            if (mode === 'view') {
                // luôn giữ pitch = 0, yaw lấy từ current
                camera.quaternion.setFromEuler(new THREE.Euler(0, yaw.current, 0, 'YXZ'));
            } else {
                // edit thì tự do yaw + pitch
                camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'));
            }

        }

        // Use device-specific movement speed
        const step = moveSpeed * delta;
        const direction = dirRef.current;
        const right = rightRef.current;
        camera.getWorldDirection(direction);
        right.crossVectors(direction, camera.up).normalize();

        camera.getWorldDirection(direction);
        right.crossVectors(direction, camera.up).normalize();

        if (mode === 'view' && !isMovingToTarget && !tourMode) {
            let nextPos = camera.position.clone();
            let moved = false;

            // Keyboard movement
            if (pressedKeys.current.has("KeyW")) { nextPos.addScaledVector(direction, step); moved = true; }
            if (pressedKeys.current.has("KeyS")) { nextPos.addScaledVector(direction, -step); moved = true; }
            if (pressedKeys.current.has("KeyA")) { nextPos.addScaledVector(right, -step); moved = true; }
            if (pressedKeys.current.has("KeyD")) { nextPos.addScaledVector(right, step); moved = true; }

            // Mobile movement (joystick input) - only when not dragging camera
            if (!isPointerDown.current && (mobileMove.current.x !== 0 || mobileMove.current.y !== 0)) {
                nextPos.addScaledVector(direction, mobileMove.current.y * step); // Forward/backward
                nextPos.addScaledVector(right, mobileMove.current.x * step); // Left/right
                moved = true;
            }

            if (moved) {
                targetBlockedRef.current = false;
            }

            nextPos.y = GROUND_LEVEL;

            // Skip collision during tour mode
            if (tourMode) {
                camera.position.copy(nextPos);
            } else {
                const safePos = moveWithCollisionDetection(camera.position, nextPos, wallBoxes, 0.5);
                camera.position.copy(safePos);
            }
        } else if (mode !== 'view' && !tourMode) {
            let moved = false;

            // Keyboard movement
            if (pressedKeys.current.has("KeyW")) { camera.position.addScaledVector(direction, step); moved = true; }
            if (pressedKeys.current.has("KeyS")) { camera.position.addScaledVector(direction, -step); moved = true; }
            if (pressedKeys.current.has("KeyA")) { camera.position.addScaledVector(right, -step); moved = true; }
            if (pressedKeys.current.has("KeyD")) { camera.position.addScaledVector(right, step); moved = true; }
            if (pressedKeys.current.has("Space")) { camera.position.y += step; moved = true; }
            if (pressedKeys.current.has("ShiftLeft") || pressedKeys.current.has("ShiftRight")) { 
                camera.position.y -= step; moved = true; 
            }

            // Mobile movement (joystick input) - only when not dragging camera
            if (!isPointerDown.current && (mobileMove.current.x !== 0 || mobileMove.current.y !== 0)) {
                camera.position.addScaledVector(direction, mobileMove.current.y * step); // Forward/backward
                camera.position.addScaledVector(right, mobileMove.current.x * step); // Left/right
                moved = true;
            }

            if (moved) {
                targetBlockedRef.current = false;
            }
        }

        if (mode === 'view') {
            camera.position.y = GROUND_LEVEL;
        }
    });

    function collidesWithWalls(pos, wallBoxes, halfSize = 0.4) {
        const camBox = new THREE.Box3().setFromCenterAndSize(
            pos.clone(),
            new THREE.Vector3(halfSize * 2, 1.7, halfSize * 2) // hitbox người
        );

        for (let [, wallBox] of wallBoxes) {
            if (wallBox.intersectsBox(camBox)) return true;
        }
        return false;
    }

    // Continuous collision detection to prevent tunneling through walls
    function moveWithCollisionDetection(currentPos, targetPos, wallBoxes, halfSize = 0.5) {
        const direction = targetPos.clone().sub(currentPos);
        const distance = direction.length();
        
        // If movement is very small, just check the target position
        if (distance < 0.01) {
            return collidesWithWalls(targetPos, wallBoxes, halfSize) ? currentPos : targetPos;
        }
        
        // Normalize direction and calculate step size
        direction.normalize();
        const maxStepSize = 0.1; // Maximum step size to prevent tunneling
        const steps = Math.ceil(distance / maxStepSize);
        const stepSize = distance / steps;
        
        let currentStepPos = currentPos.clone();
        
        // Check each step along the path
        for (let i = 1; i <= steps; i++) {
            const nextStepPos = currentPos.clone().addScaledVector(direction, stepSize * i);
            
            if (collidesWithWalls(nextStepPos, wallBoxes, halfSize)) {
                // Return the last valid position
                return currentStepPos;
            }
            
            currentStepPos = nextStepPos;
        }
        
        return targetPos;
    }
};