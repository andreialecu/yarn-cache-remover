declare module "java-caller" {
  import { ChildProcess } from "child_process";
  export class JavaCaller {
    /**
     * Creates a JavaCaller instance
     * @param {object} [opts] - Run options
     * @param {string} [opts.jar] - Path to executable jar file
     * @param {string} [opts.classPath] - If jar parameter is not set, classpath to use. Use : as separator (it will be converted if runned on Windows)
     * @param {string} [opts.mainClass] - If classPath set, main class to call
     * @param {number} [opts.minimumJavaVersion] - Minimum java version to be used to call java command. If the java version found on machine is lower, java-caller will try to install and use the appropriate one
     * @param {number} [opts.maximumJavaVersion] - Maximum java version to be used to call java command. If the java version found on machine is upper, java-caller will try to install and use the appropriate one
     * @param {string} [opts.javaType] - jre or jdk (if not defined and installation is required, jre will be installed)
     * @param {string} [opts.rootPath] - If classPath elements are not relative to the current folder, you can define a root path. You may use __dirname if you classes / jars are in your module folder
     * @param {string} [opts.javaExecutable] - You can force to use a defined java executable, instead of letting java-caller find/install one
     * @param {string} [opts.additionalJavaArgs] - Additional parameters for JVM that will be added in every JavaCaller instance runs
     */
    constructor(opts?: {
      jar?: string;
      classPath?: string;
      mainClass?: string;
      minimumJavaVersion?: number;
      maximumJavaVersion?: number;
      javaType?: string;
      rootPath?: string;
      javaExecutable?: string;
      additionalJavaArgs?: string;
    });
    "use strict": any;
    minimumJavaVersion: number;
    maximumJavaVersion: any;
    javaType: any;
    rootPath: string;
    jar: any;
    classPath: string;
    mainClass: any;
    output: string;
    status: any;
    javaSupportDir: any;
    javaExecutable: string;
    additionalJavaArgs: any[];
    javaHome: any;
    javaBin: any;
    prevPath: any;
    prevJavaHome: any;
    javaCallerSupportDir: string;
    /**
     * Runs java command of a JavaCaller instance
     * @param {string[]} [userArguments] - Java command line arguments
     * @param {object} [runOptions] - Run options
     * @param {boolean} [runOptions.detached = false] - If set to true, node will node wait for the java command to be completed. In that case, childJavaProcess property will be returned, but stdout and stderr may be empty
     * @param {number} [runOptions.waitForErrorMs = 500] - If detached is true, number of milliseconds to wait to detect an error before exiting JavaCaller run
     * @param {string} [runOptions.cwd = .] - You can override cwd of spawn called by JavaCaller runner
     * @return {Promise<{status:number, stdout:string, stderr:string, childJavaProcess:ChildProcess}>} - Command result (status, stdout, stderr, childJavaProcess)
     */
    run(
      userArguments?: string[],
      runOptions?: {
        detached?: boolean;
        waitForErrorMs?: number;
        cwd?: string;
      }
    ): Promise<{
      status: number;
      stdout: string;
      stderr: string;
      childJavaProcess: ChildProcess;
    }>;
    buildArguments(classPathStr: any, userArgs: any): any[];
    manageJavaInstall(): any;
    getInstallInCache(): Promise<boolean>;
    getJavaVersion(): Promise<number | false>;
    findJavaVersionHome(): Promise<
      | {
          javaVersionHome: string;
          javaVersionBin: string;
        }
      | {
          javaVersionHome?: undefined;
          javaVersionBin?: undefined;
        }
    >;
    checkMatchingJavaVersion(versionFound: any, file: any): boolean;
    addJavaInPath(): Promise<void>;
    getPlatformBinPath(): string;
    fail(reason: any): void;
    addInCache(version: any, file: any, java_home: any, java_bin: any): void;
  }

  export class JavaCallerCli {
    constructor(baseDir: any);
    "use strict": any;
    javaCallerOptions: any;
    process(): Promise<void>;
  }
}
