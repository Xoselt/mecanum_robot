/**
 * use for RGB-LED
 */
enum COLOR {
    //% block="red"
    red,
    //% block="green"
    green,
    //% block="blue"
    blue,
    //% block="white"
    white,
    //% block="black"
    black
}

/**
 * Pre-Defined LED colours
 */
enum vColors {
    //% block="red"
    Red = 0xff0000,
    //% block="orange"
    Orange = 0xffa500,
    //% block="yellow"
    Yellow = 0xffff00,
    //% block="green"
    Green = 0x00ff00,
    //% block="blue"
    Blue = 0x0000ff,
    //% block="indigo"
    Indigo = 0x4b0082,
    //% block="violet"
    Violet = 0x8a2be2,
    //% block="purple"
    Purple = 0xff00ff,
    //% block="white"
    White = 0xffffff,
    //% block="black"
    Black = 0x000000
}

/**
 * use for control motor
 */
enum DIR {
    //% block="Run forward"
    Run_forward = 0,
    //% block="Run back"
    Run_back = 1,
    //% block="Turn Left"
    Turn_Left = 2,
    //% block="Turn Right"
    Turn_Right = 3
}

enum LR {
    //% block="Upper left"
    Upper_left = 0,
    //% block="Lower left"
    Lower_left = 1,
    //% block="Upper right"
    Upper_right = 2,
    //% block="Lower right"
    Lower_right = 3
}

enum MotorState {
    //% block="stop"
    stop = 0,
    //% block="brake"
    brake = 1
}

enum MD {
    //% block="Forward"
    Forward = 0,
    //% block="Back"
    Back = 1
}

enum LT {
    //% block="Left"
    Left = 0,
    //% block="Right"
    Right = 1
}

enum LedCount {
    //% block="Left"
    Left = 12,
    //% block="Right"
    Right = 13
}

enum LedState {
    //% block="ON"
    ON = 4095,
    //% block="OFF"
    OFF = 0
}

enum Servo_num {
    //% block="D14"
    D14 = 14,
    //% block="D15"
    D15 = 15
}

//% color="#ff6800" icon="\uf1b9" weight=15
//% groups='["Motor", "Servo", "led", "Neo-pixel", "Sensor", "Tone"]'
namespace mecanumRobot {
    const PCA9685_ADDRESS = 0x47;
    const MODE1 = 0x00;
    const PRESCALE = 0xFE;
    const LED0_ON_L = 0x06;

    let PCA9685_Initialized = false;
    let lastTime = 0;

    function i2cRead(addr: number, reg: number): number {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
    }

    function i2cWrite(addr: number, reg: number, value: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = value;
        pins.i2cWriteBuffer(addr, buf);
    }

    function setFreq(freq: number): void {
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = Math.floor(prescaleval + 0.5);
        let oldmode = i2cRead(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cWrite(PCA9685_ADDRESS, MODE1, newmode);
        i2cWrite(PCA9685_ADDRESS, PRESCALE, prescale);
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }

    function init_PCA9685(): void {
        i2cWrite(PCA9685_ADDRESS, MODE1, 0x00);
        setFreq(50);
        for (let idx = 0; idx < 14; idx++) {
            setPwm(idx, 0, 0);
        }
        PCA9685_Initialized = true;
    }

    /**
     * set car state
     */
    //% block="car $sta"
    //% group="Motor" weight=98
    export function state(sta: MotorState): void {
        if (!PCA9685_Initialized) {
            init_PCA9685();
        }

        if (sta == MotorState.stop) {
            setPwm(0, 0, 4095);
            setPwm(1, 0, 0);
            setPwm(2, 0, 0);
            setPwm(5, 0, 4095);
            setPwm(4, 0, 0);
            setPwm(3, 0, 0);

            setPwm(6, 0, 4095);
            setPwm(7, 0, 0);
            setPwm(8, 0, 0);
            setPwm(11, 0, 4095);
            setPwm(10, 0, 0);
            setPwm(9, 0, 0);
        }

        if (sta == MotorState.brake) {
            setPwm(0, 0, 0);
            setPwm(5, 0, 0);
            setPwm(6, 0, 0);
            setPwm(11, 0, 0);
        }
    }

    /**
     * set speed of motor
     */
    //% block="Motor $M run $D speed: $speed \\%"
    //% speed.min=0 speed.max=100
    //% group="Motor" weight=97
    export function Motor(M: LR, D: MD, speed: number): void {
        if (!PCA9685_Initialized) {
            init_PCA9685();
        }
        let speed_value = Math.map(speed, 0, 100, 0, 4095);
        if (M == LR.Upper_right && D == MD.Back) {
            setPwm(0, 0, speed_value);
            setPwm(1, 0, 0);
            setPwm(2, 0, 4095);
        }
        if (M == LR.Upper_right && D == MD.Forward) {
            setPwm(0, 0, speed_value);
            setPwm(1, 0, 4095);
            setPwm(2, 0, 0);
        }

        if (M == LR.Upper_left && D == MD.Forward) {
            setPwm(5, 0, speed_value);
            setPwm(4, 0, 0);
            setPwm(3, 0, 4095);
        }
        if (M == LR.Upper_left && D == MD.Back) {
            setPwm(5, 0, speed_value);
            setPwm(4, 0, 4095);
            setPwm(3, 0, 0);
        }

        if (M == LR.Lower_right && D == MD.Back) {
            setPwm(6, 0, speed_value);
            setPwm(7, 0, 0);
            setPwm(8, 0, 4095);
        }
        if (M == LR.Lower_right && D == MD.Forward) {
            setPwm(6, 0, speed_value);
            setPwm(7, 0, 4095);
            setPwm(8, 0, 0);
        }

        if (M == LR.Lower_left && D == MD.Forward) {
            setPwm(11, 0, speed_value);
            setPwm(10, 0, 0);
            setPwm(9, 0, 4095);
        }
        if (M == LR.Lower_left && D == MD.Back) {
            setPwm(11, 0, speed_value);
            setPwm(10, 0, 4095);
            setPwm(9, 0, 0);
        }
    }

    /**
     * set servo angle
     */
    //% block="set servo to angle $angle"
    //% group="Servo" weight=70
    //% angle.min=-90 angle.max=90
    export function setServo(angle: number): void {
        pins.servoWritePin(AnalogPin.P14, angle);
    }

    /**
     * control colorful LED
     */
    //% block="$LedC Colorful LED turn $LedS"
    //% group="led" weight=76
    export function setLed(LedC: LedCount, LedS: LedState): void {
        if (!PCA9685_Initialized) {
            init_PCA9685();
        }
        setPwm(LedC, 0, LedS);
    }

    /**
     * Line tracking sensor
     */
    //% block="$LT_val LineTracking"
    //% group="Sensor" weight=69
    export function LineTracking(LT_val: LT): number {
        let val = 0;
        switch (LT_val) {
            case LT.Left:
                val = pins.digitalReadPin(DigitalPin.P1);
                break;
            case LT.Right:
                val = pins.digitalReadPin(DigitalPin.P2);
                break;
        }
        return val;
    }

    /**
     * Ultrasonic sensor
     */
    //% block="Ultrasonic"
    //% group="Sensor" weight=68
    export function ultra(): number {
        pins.setPull(DigitalPin.P15, PinPullMode.PullNone);
        pins.digitalWritePin(DigitalPin.P15, 0);
        control.waitMicros(2);
        pins.digitalWritePin(DigitalPin.P15, 1);
        control.waitMicros(10);
        pins.digitalWritePin(DigitalPin.P15, 0);

        let t = pins.pulseIn(DigitalPin.P16, PulseValue.High, 35000);
        let ret = t;

        if (ret == 0 && lastTime != 0) {
            ret = lastTime;
        }
        lastTime = t;

        return Math.round(ret / 58);
    }
}
